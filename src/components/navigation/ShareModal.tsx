import React, { useState } from 'react';
import { Share2, Copy, Check, Mail, Link as LinkIcon, CheckCircle2, Shield } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useToast } from '../ui/Toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { boardId, boardTitle, userRole } = useCanvasStore();
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'commenter' | 'viewer'>('editor');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [collaborators, setCollaborators] = useState<Array<{ email: string; role: string }>>([
    { email: 'owner@collabcanvas.com', role: 'Owner' }
  ]);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: boardId || 'demo-board',
          email: inviteEmail.trim(),
          role: selectedRole
        })
      });

      if (!res.ok) throw new Error("Failed to generate invite token.");

      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.inviteUrl}`;
      setGeneratedLink(fullUrl);

      setCollaborators(prev => [...prev, { email: inviteEmail.trim(), role: selectedRole.toUpperCase() }]);
      toast("Invitation Token Generated", `Created secure ${selectedRole} invite link.`, "success");
      setInviteEmail('');
    } catch (err: any) {
      toast("Invite Error", err.message || "Failed to create invitation link.", "error");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyGeneratedLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast("Invite Link Copied!", "Copied cryptographic token link to clipboard.", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xs select-none" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[16px] p-6 shadow-2xl border border-[#E5E7EB] bg-white flex flex-col space-y-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#111827]">Share Workspace</h2>
              <p className="text-[12px] text-[#6B7280]">Invite collaborators with cryptographic token RBAC access</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 text-sm">✕</button>
        </div>

        {/* Invite Collaborator Form */}
        <form onSubmit={handleInvite} className="space-y-3">
          <label className="block text-[13px] font-semibold text-[#374151]">Invite Collaborator by Email:</label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white rounded-[8px] text-[13px] text-[#111827] border border-[#D1D5DB] outline-none focus:border-[#2563EB]"
                required
              />
            </div>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as any)}
              className="px-3 py-2.5 bg-white border border-[#D1D5DB] rounded-[8px] text-[13px] font-semibold text-[#374151] outline-none"
            >
              <option value="editor">Can Edit</option>
              <option value="commenter">Can Comment</option>
              <option value="viewer">Can View</option>
            </select>
            <button
              type="submit"
              disabled={isInviting}
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] text-[13px] font-semibold transition-colors flex items-center space-x-1"
            >
              <span>{isInviting ? 'Inviting...' : 'Invite'}</span>
            </button>
          </div>
        </form>

        {/* Generated Token Link Display */}
        {generatedLink && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-[10px] space-y-2">
            <div className="flex items-center justify-between text-[12px] font-bold text-blue-900">
              <span className="flex items-center space-x-1.5">
                <LinkIcon className="w-4 h-4 text-[#2563EB]" />
                <span>Generated Cryptographic Invite Token Link:</span>
              </span>
              <button 
                onClick={handleCopyGeneratedLink}
                className="px-3 py-1 bg-[#2563EB] text-white rounded-[6px] text-[11px] font-semibold flex items-center space-x-1 shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
              </button>
            </div>
            <div className="text-[11px] font-mono text-blue-800 break-all bg-white p-2 rounded border border-blue-100">
              {generatedLink}
            </div>
          </div>
        )}

        {/* Collaborators List */}
        <div className="pt-2 space-y-2 border-t border-[#E5E7EB]">
          <span className="text-[12px] font-semibold text-[#374151]">People with Access:</span>
          <div className="max-h-36 overflow-y-auto space-y-1.5">
            {collaborators.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] rounded-[8px] border border-[#E5E7EB] text-[12px]">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px]">
                    {c.email[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-[#111827]">{c.email}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{c.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
