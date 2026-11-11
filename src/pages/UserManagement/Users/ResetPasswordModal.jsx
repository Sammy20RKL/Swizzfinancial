import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import * as authApi from "@/apis/auth/authApi";

export default function ResetPasswordModal({ open, onClose, user }) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const close = () => {
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      Swal.fire("Invalid Password", "Password must be at least 6 characters.", "warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire("Password Error", "Passwords do not match.", "error");
      return;
    }

    setLoading(true);

    try {
      await authApi.adminResetPassword(user.Id, newPassword);
      Swal.fire("Success!", `Password reset for ${user.Username}.`, "success");
      close();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      Swal.fire("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password — {user?.Username}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
