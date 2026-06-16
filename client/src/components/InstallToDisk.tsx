import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HardDrive, Loader2, AlertTriangle, CheckCircle2, Power } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { installApi, systemApi, type InstallDisk, type InstallProgress } from "@/lib/api";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useToast } from "@/hooks/use-toast";

const TERMINAL = ["success", "failed", "idle"];

export default function InstallToDisk() {
  const apiAvailable = useApiStatus();
  const { toast } = useToast();
  const [disks, setDisks] = useState<InstallDisk[] | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const installing = !!progress && progress.state === "running";

  useEffect(() => {
    if (!apiAvailable) return;
    installApi.getDisks().then(setDisks).catch(() => setDisks([]));
    // Adopt any in-flight install (e.g. started from the console wizard).
    installApi.getProgress().then((p) => {
      if (p.state === "running") { setProgress(p); startPolling(); }
    }).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiAvailable]);

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const p = await installApi.getProgress();
        setProgress(p);
        if (TERMINAL.includes(p.state)) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (p.state === "success") toast({ title: "Install complete", description: "Reboot and remove the USB drive." });
          if (p.state === "failed") toast({ title: "Install failed", description: p.error ?? "See details.", variant: "destructive" });
        }
      } catch { /* transient */ }
    }, 2000);
  };

  const runInstall = async () => {
    setConfirmOpen(false);
    setProgress({ state: "running", phase: "queued", percent: 0, target: selected, log: [], reboot_required: false });
    try {
      await installApi.start(selected);
      startPolling();
    } catch (e) {
      setProgress({ state: "failed", phase: "error", percent: 0, log: [], reboot_required: false, error: String(e) });
      toast({ title: "Could not start install", description: String(e), variant: "destructive" });
    }
  };

  const reboot = async () => {
    try { await systemApi.reboot(); toast({ title: "Rebooting", description: "Remove the USB drive now." }); }
    catch (e) { toast({ title: "Reboot failed", description: String(e), variant: "destructive" }); }
  };

  if (!apiAvailable) return null;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><HardDrive className="w-5 h-5 text-primary" /> Install to Disk</CardTitle>
        <CardDescription>Install Airwaves OS from this USB onto an internal drive. The selected disk will be erased.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress ? (
          <div className="space-y-3">
            {progress.state === "success" ? (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <div className="font-medium text-sm">Installed to {progress.target}</div>
                  <p className="text-sm text-muted-foreground">Reboot and remove the USB drive to boot from the internal disk.</p>
                  <Button size="sm" onClick={reboot} className="gap-2"><Power className="w-4 h-4" /> Reboot now</Button>
                </div>
              </div>
            ) : progress.state === "failed" ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Install failed</div>
                  <p className="text-sm text-muted-foreground break-words">{progress.error ?? "See logs."}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Installing to {progress.target}</span>
                  <span className="text-muted-foreground">{progress.phase}</span>
                </div>
                <Progress value={progress.percent} className="h-2" />
                <p className="text-xs text-muted-foreground">Do not power off or remove the USB drive during installation.</p>
              </div>
            )}
          </div>
        ) : disks === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Scanning for internal disks…</div>
        ) : disks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No internal disks were found to install onto. Attach an internal drive (NVMe/SATA) and reload.</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Target disk</label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger><SelectValue placeholder="Select a disk to erase and install onto" /></SelectTrigger>
                <SelectContent>
                  {disks.map((d) => (
                    <SelectItem key={d.device} value={d.device}>
                      <span className="font-mono">{d.device}</span>
                      <span className="text-muted-foreground"> — {d.size}{d.model ? ` ${d.model}` : ""}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="destructive" disabled={!selected} onClick={() => setConfirmOpen(true)} className="gap-2">
              <HardDrive className="w-4 h-4" /> Install &amp; erase
            </Button>
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Erase {selected}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>erase all data</strong> on <span className="font-mono">{selected}</span> and install Airwaves OS onto it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runInstall} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Erase and install
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
