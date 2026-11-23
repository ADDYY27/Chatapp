import mongoose from 'mongoose';
import { addMember, removeMember } from '../backend/routControlers/groupControler.js';
import Conversation from '../backend/Models/conversationModels.js';
import User from '../backend/Models/userModels.js';
import { io, getReciverSocketId } from '../backend/socket/socket.js';

async function runGroupMembershipTests() {
    let passed = 0;
    let failed = 0;

    const assert = (condition, name) => {
        if (condition) {
            console.log(`PASS: ${name}`);
            passed++;
        } else {
            console.error(`FAIL: ${name}`);
            failed++;
        }
    };

    const adminId = '60d0fe4f5311236168a109a1';
    const memberId = '60d0fe4f5311236168a109b2';
    const member2Id = '60d0fe4f5311236168a109b3';
    const nonMemberId = '60d0fe4f5311236168a109c3';
    const newCandidateId = '60d0fe4f5311236168a109d4';
    const newCandidate2Id = '60d0fe4f5311236168a109d5';
    const nonExistentUserId = '60d0fe4f5311236168a109e5';
    const validGroupId = '60d0fe4f5311236168a109f6';
    const nonExistentGroupId = '60d0fe4f5311236168a109f7';

    let testGroupDoc = null;
    let emittedEvents = [];

    const resetDoc = () => {
        testGroupDoc = {
            _id: validGroupId,
            isGroup: true,
            groupName: 'Engineering Core',
            groupAdmin: adminId,
            participants: [adminId, memberId, member2Id]
        };
        emittedEvents = [];
    };

    // Mock Conversation methods
    Conversation.findOne = async (filter) => {
        if (filter._id === validGroupId && filter.isGroup && testGroupDoc) {
            return {
                ...testGroupDoc,
                participants: [...testGroupDoc.participants]
            };
        }
        return null;
    };

    Conversation.findOneAndUpdate = (filter, update) => {
        if (!testGroupDoc) {
            return { populate: () => ({ populate: () => Promise.resolve(null) }) };
        }
        if (filter._id !== validGroupId || filter.isGroup !== true) {
            return { populate: () => ({ populate: () => Promise.resolve(null) }) };
        }

        // Validate atomic preconditions
        if (filter.participants && !testGroupDoc.participants.includes(filter.participants)) {
            return { populate: () => ({ populate: () => Promise.resolve(null) }) };
        }
        if (filter.groupAdmin && testGroupDoc.groupAdmin !== filter.groupAdmin) {
            return { populate: () => ({ populate: () => Promise.resolve(null) }) };
        }

        // Apply $addToSet
        if (update.$addToSet?.participants?.$each) {
            const current = new Set(testGroupDoc.participants);
            for (const p of update.$addToSet.participants.$each) {
                current.add(p);
            }
            testGroupDoc.participants = Array.from(current);
        }

        // Apply $pull
        if (update.$pull?.participants) {
            testGroupDoc.participants = testGroupDoc.participants.filter(
                p => p !== update.$pull.participants
            );
        }

        return {
            populate: () => ({
                populate: () => Promise.resolve({
                    ...testGroupDoc,
                    participants: testGroupDoc.participants.map(pid => ({ _id: pid, username: 'u_' + pid })),
                    groupAdmin: { _id: testGroupDoc.groupAdmin, username: 'admin' }
                })
            })
        };
    };

    User.find = (filter) => {
        const ids = filter._id.$in || [];
        const result = ids
            .filter(id => id !== nonExistentUserId)
            .map(id => ({ _id: id }));
        return {
            select: () => Promise.resolve(result)
        };
    };

    const callAddMember = async (req) => {
        let statusCode = 200;
        let responseBody = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (body) => { responseBody = body; }
        };
        await addMember(req, res);
        return { statusCode, responseBody };
    };

    const callRemoveMember = async (req) => {
        let statusCode = 200;
        let responseBody = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (body) => { responseBody = body; }
        };
        await removeMember(req, res);
        return { statusCode, responseBody };
    };

    console.log('=== GROUP MEMBERSHIP WORKFLOW VERIFICATION SUITE ===\n');

    // ----------------------------------------------------
    // Section 1: Member Addition Workflows
    // ----------------------------------------------------
    console.log('--- 1. Member Addition Workflows ---');

    // 1.1 Unauthenticated request returns 401
    {
        resetDoc();
        const res = await callAddMember({ params: { id: validGroupId }, body: { memberId: newCandidateId } });
        assert(res.statusCode === 401, 'Add: 401 for unauthenticated request');
    }

    // 1.2 Invalid group ID returns 400
    {
        resetDoc();
        const res = await callAddMember({ user: { _id: memberId }, params: { id: 'not-an-id' }, body: { memberId: newCandidateId } });
        assert(res.statusCode === 400 && res.responseBody.message.includes('Invalid group ID format'), 'Add: 400 on invalid group ID format');
    }

    // 1.3 Missing member payload returns 400
    {
        resetDoc();
        const res = await callAddMember({ user: { _id: memberId }, params: { id: validGroupId }, body: {} });
        assert(res.statusCode === 400 && res.responseBody.message.includes('Member ID is required'), 'Add: 400 on missing member payload');
    }

    // 1.4 Invalid member ID format returns 400
    {
        resetDoc();
        const res = await callAddMember({ user: { _id: memberId }, params: { id: validGroupId }, body: { memberId: 'malformed' } });
        assert(res.statusCode === 400 && res.responseBody.message.includes('Invalid member ID format'), 'Add: 400 on invalid member ID format');
    }

    // 1.5 Non-existent group returns 404
    {
        resetDoc();
        const res = await callAddMember({ user: { _id: memberId }, params: { id: nonExistentGroupId }, body: { memberId: newCandidateId } });
        assert(res.statusCode === 404 && res.responseBody.message.includes('Group not found'), 'Add: 404 on non-existent group');
    }

    // 1.6 Non-member requester returns 403 Forbidden
    {
        resetDoc();
        const res = await callAddMember({ user: { _id: nonMemberId }, params: { id: validGroupId }, body: { memberId: newCandidateId } });
        assert(res.statusCode === 403 && res.responseBody.message.includes('Only group members can add new members'), 'Add: 403 when non-member tries to add');
    }

    // 1.7 Any existing regular member CAN add new participants (200 OK)
    {
        resetDoc();
        const res = await callAddMember({ user: { _id: memberId }, params: { id: validGroupId }, body: { memberId: newCandidateId } });
        assert(res.statusCode === 200 && res.responseBody.success === true, 'Add: 200 when regular member adds new user');
        assert(testGroupDoc.participants.includes(newCandidateId), 'Add: participant added to document');
    }

    // 1.8 Group admin CAN add new participants (200 OK)
    {
        resetDoc();
        const res = await callAddMember({ user: { _id: adminId }, params: { id: validGroupId }, body: { memberId: newCandidateId } });
        assert(res.statusCode === 200 && res.responseBody.success === true, 'Add: 200 when admin adds new user');
    }

    // 1.9 Multi-member array additions (members: [id1, id2])
    {
        resetDoc();
        const res = await callAddMember({ user: { _id: memberId }, params: { id: validGroupId }, body: { members: [newCandidateId, newCandidate2Id] } });
        assert(res.statusCode === 200 && res.responseBody.success === true, 'Add: 200 on batch multi-member addition');
        assert(testGroupDoc.participants.includes(newCandidateId) && testGroupDoc.participants.includes(newCandidate2Id), 'Add: all batch members added');
    }

    // 1.10 Duplicate member check returns 400
    {
        resetDoc();
        const res = await callAddMember({ user: { _id: memberId }, params: { id: validGroupId }, body: { memberId: member2Id } });
        assert(res.statusCode === 400 && res.responseBody.message.includes('already a member'), 'Add: 400 when user is already in group');
    }

    // 1.11 Non-existent user in DB returns 404
    {
        resetDoc();
        const res = await callAddMember({ user: { _id: memberId }, params: { id: validGroupId }, body: { memberId: nonExistentUserId } });
        assert(res.statusCode === 404 && res.responseBody.message.includes('do not exist'), 'Add: 404 when target user is not registered');
    }

    // ----------------------------------------------------
    // Section 2: Member Removal Workflows
    // ----------------------------------------------------
    console.log('\n--- 2. Member Removal Workflows ---');

    // 2.1 Unauthenticated request returns 401
    {
        resetDoc();
        const res = await callRemoveMember({ params: { id: validGroupId, memberId } });
        assert(res.statusCode === 401, 'Remove: 401 for unauthenticated request');
    }

    // 2.2 Invalid group ID format returns 400
    {
        resetDoc();
        const res = await callRemoveMember({ user: { _id: adminId }, params: { id: 'invalid-group', memberId } });
        assert(res.statusCode === 400 && res.responseBody.message.includes('Invalid group ID format'), 'Remove: 400 on invalid group ID format');
    }

    // 2.3 Invalid member ID format returns 400
    {
        resetDoc();
        const res = await callRemoveMember({ user: { _id: adminId }, params: { id: validGroupId, memberId: 'invalid-member' } });
        assert(res.statusCode === 400 && res.responseBody.message.includes('Invalid member ID format'), 'Remove: 400 on invalid member ID format');
    }

    // 2.4 Non-existent group returns 404
    {
        resetDoc();
        const res = await callRemoveMember({ user: { _id: adminId }, params: { id: nonExistentGroupId, memberId } });
        assert(res.statusCode === 404 && res.responseBody.message.includes('Group not found'), 'Remove: 404 on non-existent group');
    }

    // 2.5 Regular member CANNOT remove members (403 Forbidden)
    {
        resetDoc();
        const res = await callRemoveMember({ user: { _id: memberId }, params: { id: validGroupId, memberId: member2Id } });
        assert(res.statusCode === 403 && res.responseBody.message.includes('Only the group admin can remove members'), 'Remove: 403 when non-admin member attempts removal');
    }

    // 2.6 Admin cannot remove themselves (400 Bad Request)
    {
        resetDoc();
        const res = await callRemoveMember({ user: { _id: adminId }, params: { id: validGroupId, memberId: adminId } });
        assert(res.statusCode === 400 && res.responseBody.message.includes('Group admin cannot be removed'), 'Remove: 400 when admin attempts self-removal');
    }

    // 2.7 Removing a user who is not a member returns 400 Bad Request
    {
        resetDoc();
        const res = await callRemoveMember({ user: { _id: adminId }, params: { id: validGroupId, memberId: nonMemberId } });
        assert(res.statusCode === 400 && res.responseBody.message.includes('User is not a member of this group'), 'Remove: 400 when target is not a participant');
    }

    // 2.8 Admin successfully removes a member (200 OK)
    {
        resetDoc();
        const res = await callRemoveMember({ user: { _id: adminId }, params: { id: validGroupId, memberId } });
        assert(res.statusCode === 200 && res.responseBody.success === true, 'Remove: 200 when admin removes valid member');
        assert(!testGroupDoc.participants.includes(memberId), 'Remove: participant evicted from participants array');
    }

    // 2.9 Support member ID via request body (POST /:id/remove-member)
    {
        resetDoc();
        const res = await callRemoveMember({ user: { _id: adminId }, params: { id: validGroupId }, body: { memberId: member2Id } });
        assert(res.statusCode === 200 && res.responseBody.success === true, 'Remove: 200 when memberId passed in request body');
        assert(!testGroupDoc.participants.includes(member2Id), 'Remove: participant removed via body payload');
    }

    console.log(`\n====================================================`);
    console.log(`Test Execution Summary: ${passed} passed, ${failed} failed.`);
    console.log(`====================================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runGroupMembershipTests().catch((err) => {
    console.error('Fatal error in group membership test suite:', err);
    process.exit(1);
});
