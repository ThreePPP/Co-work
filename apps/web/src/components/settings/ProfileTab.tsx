'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { api } from '../../lib/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Building, Briefcase, Save, User as UserIcon, Upload, Trash2, Loader2, Camera } from 'lucide-react';

export const ProfileTab: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useUIStore();

  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [position, setPosition] = useState(user?.position || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setDepartment(user.department || '');
      setPosition(user.position || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        message: 'Please select an image file (PNG, JPG, WebP, etc.)',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res: any = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.data?.url) {
        setAvatarUrl(res.data.url);
        addToast({
          type: 'success',
          title: 'Photo Uploaded',
          message: 'Avatar photo uploaded. Click "Save Profile Changes" to apply.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Failed to upload avatar',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    addToast({
      type: 'info',
      message: 'Photo removed. Monogram initials will be used.',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        department,
        position,
        bio,
        avatarUrl: avatarUrl || null,
      });

      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile changes have been saved.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Failed to save changes',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2.5 flex items-center justify-center gap-2.5 text-center">
          <UserIcon className="w-5 h-5 text-indigo-400" />
          Personal Information & Profile
        </h3>

        {/* Centered Large Avatar Preview & Direct Upload Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-7 pb-5 border-b border-slate-800/80 max-w-2xl mx-auto w-full">
          <div className="relative group flex-shrink-0">
            <Avatar
              name={name || 'User'}
              src={avatarUrl}
              size="3xl"
              className="shadow-2xl"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 rounded-full bg-slate-950/70 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-xs cursor-pointer"
              title="Change Photo"
            >
              <Camera className="w-8 h-8 mb-1 text-slate-200" />
              <span className="text-xs font-bold text-slate-100">Change Photo</span>
            </button>
          </div>

          <div className="space-y-3 text-center sm:text-left">
            <div>
              <h4 className="text-base font-bold text-white">Profile Photo</h4>
              <p className="text-xs text-slate-400 mt-1">
                Upload a clear image file from your computer (PNG, JPG, GIF, WebP).
              </p>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 rounded-2xl text-sm font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Work Email"
            value={user?.email}
            disabled
            helperText="Email address cannot be changed."
          />

          <Input
            label="Department"
            leftIcon={<Building className="w-4 h-4 text-slate-400" />}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <Input
            label="Job Position"
            leftIcon={<Briefcase className="w-4 h-4 text-slate-400" />}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>

        {/* Bio Textarea */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Bio / Status Description
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell your colleagues what you're currently working on..."
            className="w-full bg-slate-800/80 border border-slate-700/80 text-slate-100 text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="px-6 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20"
          >
            Save Profile Changes
          </Button>
        </div>
      </div>
    </form>
  );
};
