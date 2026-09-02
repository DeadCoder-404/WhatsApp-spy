import React, { useState, useEffect } from 'react';
import { WhatsAppStatus, WhatsAppStory } from '../types';
import { User, Sparkles, Image as ImageIcon, Send, Check, AlertCircle, Loader2, RefreshCw, Palette, MessageSquare } from 'lucide-react';

interface ProfileManagerProps {
  status: WhatsAppStatus;
  onRefreshStatus: () => void;
}

export function ProfileManager({ status, onRefreshStatus }: ProfileManagerProps) {
  // Profile state
  const [profileName, setProfileName] = useState(status.userName || '');
  const [statusBio, setStatusBio] = useState(status.userStatus || '');
  const [savingName, setSavingName] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Story state
  const [storyText, setStoryText] = useState('');
  const [storyColor, setStoryColor] = useState('#075E54');
  const [postingStory, setPostingStory] = useState(false);
  const [stories, setStories] = useState<WhatsAppStory[]>([]);

  const colorPalettes = [
    { name: 'WhatsApp Emerald', hex: '#075E54' },
    { name: 'Teal Green', hex: '#128C7E' },
    { name: 'Neon Green', hex: '#25D366' },
    { name: 'Midnight Violet', hex: '#6b21a8' },
    { name: 'Ruby Crimson', hex: '#be123c' },
    { name: 'Amber Sunset', hex: '#b45309' },
    { name: 'Deep Space', hex: '#0f172a' },
    { name: 'Ocean Cyan', hex: '#0e7490' },
  ];

  useEffect(() => {
    if (status.userName) setProfileName(status.userName);
    if (status.userStatus) setStatusBio(status.userStatus);
    fetchStories();
  }, [status.userName, status.userStatus]);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/whatsapp/stories');
      const data = await res.json();
      if (data.stories) setStories(data.stories);
    } catch {
      // ignore
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setSavingName(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/whatsapp/profile/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Profile display name updated successfully!' });
        onRefreshStatus();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update name' });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Error updating name' });
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdateBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusBio.trim()) return;
    setSavingBio(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/whatsapp/profile/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusBio.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'WhatsApp Bio / About status updated!' });
        onRefreshStatus();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update status bio' });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Error updating status bio' });
    } finally {
      setSavingBio(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPic(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/whatsapp/profile/picture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await res.json();
        if (data.success) {
          setFeedback({ type: 'success', message: 'Profile picture uploaded and applied!' });
          onRefreshStatus();
        } else {
          setFeedback({ type: 'error', message: data.message || 'Failed to update profile picture' });
        }
      } catch (err: unknown) {
        setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Upload failed' });
      } finally {
        setUploadingPic(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePostStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyText.trim()) return;
    setPostingStory(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/whatsapp/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: storyText.trim(),
          backgroundColor: storyColor,
          font: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Status story broadcasted to WhatsApp status@broadcast!' });
        setStoryText('');
        fetchStories();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to post story' });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to post story' });
    } finally {
      setPostingStory(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Status Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-lg text-xs font-mono border animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Grid: Profile Management & Status Story Broadcaster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account Profile Editor */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">WhatsApp Identity Profile</h3>
                  <p className="text-[11px] text-zinc-400">Configure public display name, bio & avatar</p>
                </div>
              </div>
              <button
                id="refresh-profile-btn"
                onClick={onRefreshStatus}
                title="Refresh Profile"
                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="relative w-16 h-16 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-zinc-400 overflow-hidden shadow-inner shrink-0">
                {status.profilePicUrl ? (
                  <img src={status.profilePicUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-zinc-500" />
                )}
                {uploadingPic && (
                  <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Profile Photo</h4>
                <p className="text-[11px] text-zinc-400">Upload an image to update WhatsApp profile picture</p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-mono cursor-pointer transition-colors mt-1">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Choose Photo</span>
                  <input
                    id="profile-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Display Name Form */}
            <form onSubmit={handleUpdateName} className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Account Display Name:
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="profile-name-input"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. AI Customer Care / Bot"
                  className="flex-1 px-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-zinc-100 placeholder:text-zinc-600 font-mono"
                />
                <button
                  id="save-profile-name-btn"
                  type="submit"
                  disabled={savingName || !profileName.trim()}
                  className="px-3.5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                >
                  {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            </form>

            {/* About / Bio Status Form */}
            <form onSubmit={handleUpdateBio} className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                WhatsApp About / Status Bio:
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="profile-bio-input"
                  type="text"
                  value={statusBio}
                  onChange={(e) => setStatusBio(e.target.value)}
                  placeholder="e.g. Available 24/7 • Automated Assistant"
                  className="flex-1 px-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-zinc-100 placeholder:text-zinc-600 font-mono"
                />
                <button
                  id="save-profile-bio-btn"
                  type="submit"
                  disabled={savingBio || !statusBio.trim()}
                  className="px-3.5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                >
                  {savingBio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
                Updates the about status visible on your contact info card.
              </p>
            </form>
          </div>
        </div>

        {/* Right Column: Status / Story Broadcaster */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">Broadcast WhatsApp Status Story</h3>
                  <p className="text-[11px] text-zinc-400">Post ephemeral stories to contacts (status@broadcast)</p>
                </div>
              </div>
            </div>

            {/* Story Editor & Live Mobile Preview */}
            <form onSubmit={handlePostStory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Status Story Content:
                </label>
                <textarea
                  id="story-text-input"
                  rows={3}
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Type your WhatsApp status broadcast here (e.g. System maintenance complete! 🚀)..."
                  className="w-full p-3 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-zinc-100 placeholder:text-zinc-600 resize-none font-mono"
                />
              </div>

              {/* Color Palette Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-zinc-400" /> Story Background Theme:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {colorPalettes.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setStoryColor(c.hex)}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`w-6 h-6 rounded-full transition-all border-2 ${
                        storyColor === c.hex
                          ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Live Story Preview:</span>
                <div
                  style={{ backgroundColor: storyColor }}
                  className="w-full h-28 rounded-lg p-4 flex flex-col items-center justify-center text-center text-white font-medium shadow-inner transition-colors duration-300 border border-white/10"
                >
                  <p className="text-xs line-clamp-3 font-mono font-bold px-4 drop-shadow-md">
                    {storyText.trim() || 'Your WhatsApp Story Text Appears Here...'}
                  </p>
                  <span className="text-[9px] text-white/70 mt-2 font-mono uppercase tracking-wider">
                    Just now • status@broadcast
                  </span>
                </div>
              </div>

              {/* Post Button */}
              <button
                id="post-story-submit-btn"
                type="submit"
                disabled={postingStory || !storyText.trim() || !status.connected}
                className="w-full py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)]"
              >
                {postingStory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {status.connected ? 'Publish to WhatsApp Status' : 'Connect WhatsApp to Post'}
              </button>
            </form>

            {/* Recent Stories List */}
            {stories.length > 0 && (
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-zinc-500" /> Recent Stories:
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {stories.slice(0, 3).map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: st.backgroundColor }}
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                        />
                        <span className="text-zinc-300 truncate max-w-[200px]">{st.text}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(st.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
