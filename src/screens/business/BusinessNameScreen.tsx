import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';

const TOTAL_STEPS = 10;

export function BusinessNameScreen() {
  const router = useRouter();
  const draftName = useBusinessOnboardingStore((s) => s.draft.name);
  const updateDraft = useBusinessOnboardingStore((s) => s.updateDraft);
  const [name, setName] = useState(draftName);

  return (
    <AuthScreenLayout
      title="What's your business called?"
      subtitle="This is what customers will see first."
      progress={1 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <Button
          label="Continue"
          disabled={!name.trim()}
          onPress={() => {
            updateDraft({ name: name.trim() });
            router.push('/business-categories');
          }}
        />
      }
    >
      <Input label="Business name" value={name} onChangeText={setName} placeholder="Glow Beauty Lounge" autoFocus />
    </AuthScreenLayout>
  );
}
