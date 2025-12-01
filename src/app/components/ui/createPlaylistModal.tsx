"use client";
import React, { useState } from "react";
import Modal from "./modal";
import Button from "./button";

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, description: string, ownerIds: string[], picture?: string) => Promise<void>;
  isAlbum?: boolean;
  userId: string | null;
}

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  onConfirm,
  isAlbum = false,
  userId,
}: CreatePlaylistModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [additionalOwners, setAdditionalOwners] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !userId) return;

    setIsCreating(true);
    try {
      // Parse comma-separated owner IDs and filter out empty strings
      const additionalOwnerIds = additionalOwners
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);
      
      // Always include the current user's ID first, then add any additional owners
      const ownerIds = [userId, ...additionalOwnerIds];
      
      await onConfirm(name.trim(), description.trim(), ownerIds);
      setName("");
      setDescription("");
      setAdditionalOwners("");
      onClose();
    } catch (error) {
      console.error("Error creating playlist:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setName("");
      setDescription("");
      setAdditionalOwners("");
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Create ${isAlbum ? "Album" : "Playlist"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="playlist-name" className="block text-sm font-medium mb-2">
            Name
          </label>
          <input
            id="playlist-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`My ${isAlbum ? "Album" : "Playlist"}`}
            className="w-full px-4 py-2.5 bg-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
            disabled={isCreating}
          />
        </div>

        <div>
          <label htmlFor="playlist-description" className="block text-sm font-medium mb-2">
            Description (optional)
          </label>
          <textarea
            id="playlist-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={3}
            className="w-full px-4 py-2.5 bg-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            disabled={isCreating}
          />
        </div>

        <div>
          <label htmlFor="additional-owners" className="block text-sm font-medium mb-2">
            Additional Owners (optional)
          </label>
          <input
            id="additional-owners"
            type="text"
            value={additionalOwners}
            onChange={(e) => setAdditionalOwners(e.target.value)}
            placeholder="Enter user IDs separated by commas"
            className="w-full px-4 py-2.5 bg-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isCreating}
          />
          <p className="text-xs text-gray-400 mt-1">
            You are already included as an owner. Add other user IDs separated by commas.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button
            type="button"
            onClick={handleClose}
            variant="outline"
            width="auto"
            size="md"
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="green"
            width="auto"
            size="md"
            disabled={isCreating || !name.trim()}
          >
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
