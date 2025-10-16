"use client";

import { ImmersiveContainer } from "@/components/immersive-container";
import { TravelView } from "@/components/travel-view";

export default function RelaxPage() {
  return (
    <ImmersiveContainer
      showBackButton={true}
      backButtonPosition="top-left"
      showEmotionCharacter={true}
      backRoute="/"
    >
      <TravelView />
    </ImmersiveContainer>
  );
}

