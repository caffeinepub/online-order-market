import { useState } from "react";

export function useNotifSound() {
  const [selectedSound, setSelectedSoundState] = useState<string>(
    () => localStorage.getItem("notifSound") ?? "bell",
  );

  const setSelectedSound = (id: string) => {
    localStorage.setItem("notifSound", id);
    setSelectedSoundState(id);
  };

  return { selectedSound, setSelectedSound };
}
