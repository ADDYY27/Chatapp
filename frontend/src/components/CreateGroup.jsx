import { useState } from "react";
import axiosInstance from "../utils/axios";
import useGetUsers from "../hooks/useGetUsers";

const CreateGroup = ({ onCancel, onGroupCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  const { users, loading } = useGetUsers(search);

  const toggleMember = (user) => {
    const alreadySelected = selectedMembers.some(
      (member) => member._id === user._id
    );

    if (alreadySelected) {
      setSelectedMembers((prev) =>
        prev.filter((member) => member._id !== user._id)
      );
    } else {
      setSelectedMembers((prev) => [...prev, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Enter group name");
      return;
    }

    if (selectedMembers.length === 0) {
      alert("Select at least one member");
      return;
    }

    try {
      setCreating(true);

      const response = await axiosInstance.post("/group/create", {
        groupName: groupName.trim(),
        members: selectedMembers.map((member) => member._id),
      });

      if (response.data.success) {
        onGroupCreated(response.data.group);
      }
    } catch (error) {
      console.log("Error creating group:", error);
      alert(
        error.response?.data?.message || "Failed to create group"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Create Group</h2>
          <p className="text-sm text-base-content/50">
            Add members to your group
          </p>
        </div>

        <button
          onClick={onCancel}
          className="btn btn-sm btn-ghost"
        >
          ✕
        </button>
      </div>

      {/* Group Name */}
      <div className="mb-4">
        <label className="text-sm font-semibold mb-2 block">
          Group Name
        </label>

        <input
          type="text"
          placeholder="Enter group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold mb-2">
            Selected Members ({selectedMembers.length})
          </p>

          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((member) => (
              <div
                key={member._id}
                className="badge badge-primary gap-1 py-3"
              >
                {member.fullname}

                <button
                  onClick={() => toggleMember(member)}
                  className="ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Members */}
      <div className="mb-3">
        <label className="text-sm font-semibold mb-2 block">
          Add Members
        </label>

        <input
          type="text"
          placeholder="Search people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      {/* Users */}
      <div className="flex-1 overflow-y-auto">
        {loading && search.trim() && (
          <div className="text-center py-5">
            <span className="loading loading-spinner loading-sm" />
          </div>
        )}

        {!loading &&
          search.trim() &&
          users.length === 0 && (
            <p className="text-center text-sm text-base-content/50 py-5">
              No users found
            </p>
          )}

        {search.trim() &&
          users.map((user) => {
            const isSelected = selectedMembers.some(
              (member) => member._id === user._id
            );

            return (
              <div
                key={user._id}
                onClick={() => toggleMember(user)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-1 ${
                  isSelected
                    ? "bg-primary/15"
                    : "hover:bg-base-300/50"
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold">
                  {user.fullname?.charAt(0).toUpperCase() || "?"}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {user.fullname}
                  </p>

                  <p className="text-xs text-base-content/50 truncate">
                    @{user.username}
                  </p>
                </div>

                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="checkbox checkbox-primary"
                />
              </div>
            );
          })}
      </div>

      {/* Bottom Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onCancel}
          className="btn btn-ghost flex-1"
          disabled={creating}
        >
          Cancel
        </button>

        <button
          onClick={handleCreateGroup}
          className="btn btn-primary flex-1"
          disabled={creating}
        >
          {creating ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Create Group"
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateGroup;