import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSetSsh, useSshStatus } from "@/hooks/useAirwavesApi";
import { useToast } from "@/hooks/use-toast";

/** Turns the device's SSH server (ssh.service) on and off through the manager. */
export default function SshSetting({ apiAvailable }: { apiAvailable: boolean }) {
  const { data: ssh, isLoading } = useSshStatus(apiAvailable);
  const setSsh = useSetSsh();
  const { toast } = useToast();
  const [confirmOff, setConfirmOff] = useState(false);

  const apply = (on: boolean) => {
    setSsh.mutate(on, {
      onSuccess: (status) => {
        toast({
          title: status.enabled ? "SSH turned on" : "SSH turned off",
          description: status.active
            ? "The SSH server is running and starts at boot."
            : "The SSH server is stopped and will not start at boot.",
        });
      },
      onError: (err) => {
        toast({
          title: "Could not change SSH",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      },
    });
  };

  const on = Boolean(ssh?.enabled || ssh?.active);
  let detail = "Allow remote command line access.";
  if (!apiAvailable) detail = "Connect to the device to manage SSH.";
  else if (isLoading) detail = "Checking SSH server…";
  else if (ssh && !ssh.available) detail = "This device has no SSH server installed.";
  else if (ssh) {
    detail = ssh.active
      ? `Running${ssh.enabled ? " and starts at boot" : ", but will not start at boot"}.`
      : ssh.enabled
        ? "Starts at boot, but is not running now."
        : "Off. Nobody can log in over SSH.";
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-base" htmlFor="ssh-switch">SSH Access</Label>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
      <Switch
        id="ssh-switch"
        checked={on}
        disabled={!apiAvailable || !ssh?.available || setSsh.isPending}
        onCheckedChange={(next) => (next ? apply(true) : setConfirmOff(true))}
      />
      <AlertDialog open={confirmOff} onOpenChange={setConfirmOff}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn off SSH?</AlertDialogTitle>
            <AlertDialogDescription>
              The SSH server stops now and won't start at boot. Open SSH
              sessions are disconnected. You can turn it back on here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => apply(false)}>Turn off SSH</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
