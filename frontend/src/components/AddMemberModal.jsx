import { useState, useMemo } from "react";
import axiosInstance from "../utils/axios";
import useGetUsers from "../hooks/useGetUsers";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

const AddMemberModal = ({ group, onClose, onMembersAdded }) => {
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { users, loading } = useGetUsers(search);

  // Set of existing member IDs
  const existingMemberIds = useMemo(() => {
    return new Set(
      (group?.participants || []).map((p) => (p._id || p)?.toString())
    );
  }, [group?.participants]);

  const toggleSelectUser = (user) => {
    const userId = user._id?.toString();
    if (existingMemberIds.has(userId)) return;

    setSelectedUsers((prev) => {
      const already = prev.some((u) => u._id === user._id);
      if (already) {
        return prev.filter((u) => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one person to add");
      return;
    }

    try {
      setSubmitting(true);
      const memberIds = selectedUsers.map((u) => u._id);
      const res = await axiosInstance.post(`/group/${group._id}/members`, {
        members: memberIds,
      });

      if (res.data.success) {
        toast.success(
          selectedUsers.length === 1
            ? "Member added successfully"
            : `${selectedUsers.length} members added successfully`
        );
        if (onMembersAdded) {
          onMembersAdded(res.data.group);
        }
        onClose();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add member(s)");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--ng-panel)",
          borderRadius: "var(--r-card)",
          border: "1px solid var(--ng-border)",
          width: 380,
          maxWidth: "92vw",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--ng-border)",
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--ng-text)",
                margin: 0,
              }}
            >
              Add Members
            </h3>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--ng-muted)",
                margin: "2px 0 0",
              }}
            >
              to {group?.groupName}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ng-muted)",
              fontSize: 18,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: "14px 20px 8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--ng-hover)",
              border: "1px solid var(--ng-border)",
              borderRadius: "var(--r-btn)",
              padding: "8px 12px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--ng-muted)"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--ng-text)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                width: "100%",
              }}
            />
          </div>
        </div>

        {/* Selected chips */}
        {selectedUsers.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              padding: "4px 20px 8px",
              maxHeight: 70,
              overflowY: "auto",
            }}
          >
            {selectedUsers.map((u) => (
              <span
                key={u._id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "rgba(232,163,61,0.18)",
                  border: "1px solid var(--ng-accent)",
                  color: "var(--ng-text)",
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 14,
                  padding: "2px 8px",
                }}
              >
                {u.fullname || u.username}
                <button
                  onClick={() => toggleSelectUser(u)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ng-text)",
                    fontSize: 12,
                    lineHeight: 1,
                    padding: 0,
                    marginLeft: 2,
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* User list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minHeight: 180,
          }}
        >
          {loading && search.trim() ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "24px 0",
              }}
            >
              <span className="loading loading-spinner loading-sm" />
            </div>
          ) : !loading && search.trim() && users.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--ng-muted)",
                textAlign: "center",
                padding: "24px 0",
                margin: 0,
              }}
            >
              No users found matching "{search}"
            </p>
          ) : !search.trim() ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--ng-muted)",
                textAlign: "center",
                padding: "24px 0",
                margin: 0,
              }}
            >
              Type a name or username above to find members to add
            </p>
          ) : (
            users.map((user) => {
              const userId = user._id?.toString();
              const isAlreadyMember = existingMemberIds.has(userId);
              const isSelected = selectedUsers.some((u) => u._id === user._id);

              return (
                <div
                  key={user._id}
                  onClick={() => !isAlreadyMember && toggleSelectUser(user)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: "var(--r-btn)",
                    background: isSelected
                      ? "rgba(232,163,61,0.12)"
                      : "transparent",
                    cursor: isAlreadyMember ? "not-allowed" : "pointer",
                    opacity: isAlreadyMember ? 0.55 : 1,
                    border: isSelected
                      ? "1px solid var(--ng-accent)"
                      : "1px solid transparent",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  <Avatar
                    src={user.profilepic}
                    name={user.fullname || user.username}
                    size={36}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--ng-text)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.fullname}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: "var(--ng-muted)",
                        margin: 0,
                      }}
                    >
                      @{user.username}
                    </p>
                  </div>

                  {isAlreadyMember ? (
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--ng-muted)",
                        background: "var(--ng-hover)",
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      In group
                    </span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectUser(user)}
                      style={{
                        accentColor: "var(--ng-accent)",
                        cursor: "pointer",
                        width: 16,
                        height: 16,
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: "1px solid var(--ng-border)",
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "var(--ng-hover)",
              border: "1px solid var(--ng-border)",
              color: "var(--ng-text)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 13,
              borderRadius: "var(--r-btn)",
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleAddMembers}
            disabled={selectedUsers.length === 0 || submitting}
            style={{
              flex: 1.5,
              background:
                selectedUsers.length === 0 || submitting
                  ? "var(--ng-border)"
                  : "var(--ng-accent)",
              border: "none",
              color:
                selectedUsers.length === 0 || submitting
                  ? "var(--ng-muted)"
                  : "var(--ng-accent-fg)",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 13,
              borderRadius: "var(--r-btn)",
              padding: "8px 14px",
              cursor:
                selectedUsers.length === 0 || submitting
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {submitting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : selectedUsers.length > 0 ? (
              `Add (${selectedUsers.length})`
            ) : (
              "Add to Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
