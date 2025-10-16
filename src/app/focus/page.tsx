"use client";

import { ImmersiveContainer } from "@/components/immersive-container";
import { PomodoroTimerOptimized } from "@/components/pomodoro-timer-optimized";

export default function FocusPage() {
  return (
    <ImmersiveContainer
      showBackButton={true}
      backButtonPosition="top-left"
      showEmotionCharacter={true}
      backRoute="/"
    >
      <PomodoroTimerOptimized />
    </ImmersiveContainer>
  );
}

