'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, PlusCircle, X } from 'lucide-react'

type Goal = {
  id: string
  content: string
}

type GrokData = {
  corePrinciples?: {
    introduction: string;
    principles: Array<{
      sequence_number: number;
      principle: string;
      brief_explanation: string;
      learning_objectives: string[];
    }>;
  };
  lessonPlans?: {
    lesson_plans: Array<{
      lesson_number: number;
      lesson_name: string;
      principles_covered: number[];
      lesson_objectives: string;
    }>;
  };
};

const defaultConcept = "Golden Path"
const defaultBackground = "27 year old who works as an AI engineer and studied neuroscience at a liberal arts college"
const defaultGoals = [
  { id: '1', content: "Understand the philosophy of Frank Herbert's Golden Path" },
]

export default function Home() {
  const [concept, setConcept] = useState(defaultConcept)
  const [background, setBackground] = useState(defaultBackground)
  const [goals, setGoals] = useState<Goal[]>(defaultGoals)
  const [isLoading, setIsLoading] = useState(false)
  const [curriculumLoading, setCurriculumLoading] = useState(false)
  const [lessonPlansLoading, setLessonPlansLoading] = useState(false)
  const [grokData, setGrokData] = useState<GrokData | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null)
  const [lessonOutline, setLessonOutline] = useState<any>(null)

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
    setCurriculumLoading(true)
    setLessonPlansLoading(true)
    setGrokData({})
    
    try {
      // Call curriculum planner
      const curriculumResponse = await fetch('/api/generateCurriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          background,
          goals: goals.map(goal => goal.content).filter(Boolean)
        }),
      })
      const curriculumData = await curriculumResponse.json()
      setGrokData(prevData => ({ ...prevData, corePrinciples: curriculumData }))
      setCurriculumLoading(false)

      // Call lesson planner
      const lessonPlannerResponse = await fetch('/api/generateLessonPlans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          background,
          goals: goals.map(goal => goal.content).filter(Boolean),
          corePrinciples: curriculumData
        }),
      })
      const lessonPlansData = await lessonPlannerResponse.json()
      setGrokData(prevData => ({ ...prevData, lessonPlans: lessonPlansData }))
      setLessonPlansLoading(false)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLessonSelect = async (lessonNumber: number) => {
    if (!grokData?.corePrinciples || !grokData?.lessonPlans) return
    setSelectedLesson(lessonNumber)
    try {
      const response = await fetch('/api/generateLessonOutline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          background,
          goals: goals.map(goal => goal.content).filter(Boolean),
          corePrinciples: grokData.corePrinciples,
          lessonPlan: grokData.lessonPlans.lesson_plans.find(lp => lp.lesson_number === lessonNumber),
        }),
      })
      const data = await response.json()
      setLessonOutline(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Grok Tuah Learning System</h1>
      {!grokData?.corePrinciples ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate Your Grok</CardTitle>
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
      ) : (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent>
              {curriculumLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <p>{grokData.corePrinciples.introduction}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Core Principles</CardTitle>
            </CardHeader>
            <CardContent>
              {curriculumLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <ul className="list-disc pl-5 space-y-2">
                  {grokData.corePrinciples.principles.map((principle, index) => (
                    <li key={index} className="text-blue-600 hover:underline cursor-pointer">
                      {principle.principle}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              {lessonPlansLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : grokData.lessonPlans ? (
                <div className="flex flex-wrap gap-2">
                  {grokData.lessonPlans.lesson_plans.map((lesson) => (
                    <Button
                      key={lesson.lesson_number}
                      onClick={() => handleLessonSelect(lesson.lesson_number)}
                      variant={selectedLesson === lesson.lesson_number ? "default" : "outline"}
                    >
                      Lesson {lesson.lesson_number}: {lesson.lesson_name}
                    </Button>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
          {lessonOutline && (
            <Card>
              <CardHeader>
                <CardTitle>{lessonOutline.lesson_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div dangerouslySetInnerHTML={{ __html: lessonOutline.content }} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  )
}