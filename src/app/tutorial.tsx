import { router } from 'expo-router';

import { IntroSlides } from '@/components/onboarding/intro-slides';

/** Repite la presentación desde el perfil, sin volver a crear la colección. */
export default function Tutorial() {
  return <IntroSlides doneLabel="Volver a la app" onDone={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
