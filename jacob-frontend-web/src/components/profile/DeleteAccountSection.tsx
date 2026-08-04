'use client';

import React from 'react';
import { Trash2, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteAccountMutation } from '@/store/services/apiSlice';

export default function DeleteAccountSection() {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();

  const handleDelete = async () => {
    try {
      const payload = await deleteAccount().unwrap();
      toast.success(payload.message || 'Your account has been deleted.');
      setOpen(false);
      await logout();
      router.replace('/login');
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(message || 'Could not delete your account right now.');
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-red-200 bg-red-50/60 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-red-700">
              <Trash2 size={20} /> Delete Account
            </h3>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-red-600/80">
              Permanently remove your profile and sign-in access. This action cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="h-12 shrink-0 rounded-xl border-red-300 bg-white px-6 font-black text-red-600 hover:bg-red-600 hover:text-white"
          >
            Delete Account
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(nextOpen) => !isLoading && setOpen(nextOpen)}>
        <DialogContent className="max-w-md rounded-[2rem] border-red-100 p-8">
          <DialogHeader>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <TriangleAlert size={28} />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900">Delete your account?</DialogTitle>
            <DialogDescription className="pt-2 font-medium leading-6 text-slate-500">
              Your profile, sign-in access, services, and account preferences will be removed permanently. Completed transaction records may be retained for operational and legal purposes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-3 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => setOpen(false)}
              className="h-12 rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={() => void handleDelete()}
              className="h-12 rounded-xl bg-red-600 font-black text-white hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Yes, Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
