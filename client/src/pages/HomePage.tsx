import { HeroSection } from '../components/HeroSection'
import { RecipeCard } from '../components/RecipeCard'
import { FeatureCards } from '../components/FeatureCards'
import type { GroceryList, LlmProvider } from '../types'

interface HomePageProps {
  llmProvider: LlmProvider
  onLlmProviderChange: (provider: LlmProvider) => void
  // A generated dish is saved as a recipe only; grocery lists are created later by merging recipes
  // on the Recipes page. Returns true once persisted, so the card can confirm it.
  onListGenerated: (list: GroceryList) => Promise<boolean>
}

export function HomePage({ llmProvider, onLlmProviderChange, onListGenerated }: HomePageProps) {
  return (
    <>
      <HeroSection />
      <RecipeCard
        llmProvider={llmProvider}
        onLlmProviderChange={onLlmProviderChange}
        onListGenerated={onListGenerated}
      />
      <FeatureCards />
      <p className="mt-16 text-center text-xs text-gray-400 dark:text-gray-600">
        ByteBite · AI-powered grocery assistant
      </p>
    </>
  )
}
