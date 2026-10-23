import { useSettings } from "@/hooks/use-settings";
import { ModeToggle } from "../mode-toggle";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { Label } from "../ui/label";

export const SettingsModal = () => {
  const settings = useSettings();

  return (
    <Dialog open={settings.isOpen} onOpenChange={settings.onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="border-b pb-3">
          <h2 className="text-xl font-semibold">My Settings</h2>
        </DialogHeader>
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-y-1">
            <Label className="text-base font-medium">Appearance</Label>
            <p className="text-sm text-muted-foreground">
              Customize how your workspace looks on your device
            </p>
          </div>
          <div>
            <ModeToggle />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
