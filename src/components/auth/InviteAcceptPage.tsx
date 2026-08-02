import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { FirestoreService } from '../../services/firestoreService';
import { useToast } from '../ui/Toast';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ConstellationLogo } from '../ui/ConstellationLogo';
import { AiAtmosphere } from '../ui/AiAtmosphere';
import { getApiUrl } from '../../config/api';

export const InviteAcceptPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();
  const { toast } = useToast();

  const [status, setStatus] = useState<'verifying' | 'redirecting_login' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setStatus('error');
      setErrorMsg('No invitation token provided in URL.');
      return;
    }

    // Step 1: Unauthenticated Guard -> Save token and redirect to login
    if (!user) {
      sessionStorage.setItem('pending_invite_token', token);
      localStorage.setItem('pending_invite_token', token);
      setStatus('redirecting_login');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
      return;
    }

    // Step 2: Authenticated User -> Verify token, attach collaborator, and open board directly
    const verifyAndJoin = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/verify-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (!res.ok) {
          throw new Error('Invitation token is invalid, expired, or already used.');
        }

        const data = await res.json();

        // Write collaborator document into Firestore: boards/{boardId}/collaborators/{uid}
        await FirestoreService.addBoardCollaborator(data.boardId, {
          uid: user.uid,
          email: user.email || data.email,
          displayName: user.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL
        }, data.role || 'editor');

        sessionStorage.removeItem('pending_invite_token');
        localStorage.removeItem('pending_invite_token');

        setStatus('success');
        toast("Invitation Accepted", `Joined workspace as ${data.role || 'editor'}.`, "success");

        // Redirect directly to /board/:boardId (never to dashboard)
        setTimeout(() => {
          navigate(`/board/${data.boardId}`, { replace: true });
        }, 800);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Token verification failed.');
      }
    };

    verifyAndJoin();
  }, [token, user, authLoading, navigate, toast]);

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative select-none">
      <AiAtmosphere />

      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-[16px] p-8 shadow-xl relative z-10 text-center space-y-6">
        <div className="flex justify-center">
          <ConstellationLogo size={44} />
        </div>

        {status === 'verifying' && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin mx-auto" />
            <h2 className="text-[18px] font-bold text-[#111827]">Verifying Invitation Token...</h2>
            <p className="text-[13px] text-[#6B7280]">Connecting to FastAPI backend signaling server</p>
          </div>
        )}

        {status === 'redirecting_login' && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mx-auto" />
            <h2 className="text-[18px] font-bold text-[#111827]">Sign In Required</h2>
            <p className="text-[13px] text-[#6B7280]">Redirecting to authentication to accept workspace invitation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h2 className="text-[18px] font-bold text-[#111827]">Invitation Accepted!</h2>
            <p className="text-[13px] text-[#6B7280]">Opening collaborative workspace...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="text-[18px] font-bold text-[#111827]">Invitation Error</h2>
            <p className="text-[13px] text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{errorMsg}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-[#2563EB] text-white text-[13px] font-semibold rounded-[8px]"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
