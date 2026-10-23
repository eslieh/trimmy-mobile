import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';

const TOTAL_STEPS = 11;

export function BusinessNameScreen() {
  const router = useRouter();
  const draftName = useBusinessOnboardingStore((s) => s.draft.name);
  const draftDescription = useBusinessOnboardingStore((s) => s.draft.description);
  const updateDraft = useBusinessOnboardingStore((s) => s.updateDraft);
  const [name, setName] = useState(draftName);
  const [description, setDescription] = useState(draftDescription);

  return (
    <AuthScreenLayout
      title="What's your business called?"
      subtitle="This is what customers will see first."
      progress={1 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <Button
          label="Continue"
          disabled={!name.trim() || !description.trim()}
          onPress={() => {
            updateDraft({ name: name.trim(), description: description.trim() });
            router.push('/business-categories');
          }}
        />
      }
    >
      <Input label="Business name" value={name} onChangeText={setName} placeholder="Glow Beauty Lounge" autoFocus />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Tell customers what makes your business special…"
        multiline
        numberOfLines={4}
      />
    </AuthScreenLayout>
  );
}
