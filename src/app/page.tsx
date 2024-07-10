'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, PlusCircle, X } from 'lucide-react'

type Goal = {
  id: string
  content: string
}

const defaultConcept = ""
const defaultBackground = ""
const defaultGoals = [{ id: '1', content: '' }]

export default function Home() {
  const [concept, setConcept] = useState(defaultConcept)
  const [background, setBackground] = useState(defaultBackground)
  const [goals, setGoals] = useState<Goal[]>(defaultGoals)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const addGoal = () => {
    setGoals([...goals, { id: Date.now().toString(), content: '' }])
  }

  const removeGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id))
  }

  const updateGoal = (id: string, content: string) => {
    setGoals(goals.map(goal => goal.id === id ? { ...goal, content } : goal))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    
    try {
      const queryParams = new URLSearchParams({
        concept: encodeURIComponent(concept),
        background: encodeURIComponent(background),
        goals: goals.map(goal => encodeURIComponent(goal.content)).join(',')
      }).toString()

      router.push(`/grok/new?${queryParams}`)
    } catch (error) {
      console.error('Error:', error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Grok Tuah Learning System</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create New Grok</CardTitle>
          <CardDescription>Enter the concept you want to learn, your background, and your learning goals.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="concept" className="block text-sm font-medium text-gray-700">Concept</label>
              <Input
                id="concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Enter the concept you want to learn"
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="background" className="block text-sm font-medium text-gray-700">Background</label>
              <Textarea
                id="background"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Describe your current knowledge and experience"
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Goals</label>
              {goals.map((goal, index) => (
                <div key={goal.id} className="flex items-center mt-1">
                  <Input
                    value={goal.content}
                    onChange={(e) => updateGoal(goal.id, e.target.value)}
                    placeholder={`Goal ${index + 1}`}
                    className="flex-grow"
                  />
                  {goals.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGoal(goal.id)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addGoal} className="mt-2">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Grok...
              </>
            ) : (
              'Generate Grok'
            )}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}