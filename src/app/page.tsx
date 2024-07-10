'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, PlusCircle, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from 'react-markdown'
import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'
import { Components } from 'react-markdown'
import rehypeRaw from 'rehype-raw'

type Goal = {
  id: string
  content: string
}

type CorePrinciple = {
  sequence_number: number;
  principle: string;
  brief_explanation: string;
  learning_objectives: string[];
};

type GrokData = {
  corePrinciples?: {
    introduction: string;
    principles: CorePrinciple[];
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

type LessonOutline = {
  lesson_number: number;
  lesson_name: string;
  content: string;
  artifacts: any[]; // We'll define this more precisely later
};

type ExtendedComponents = Components & {
  inlineMath: React.ComponentType<{ value: string }>
  math: React.ComponentType<{ value: string }>
}

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
  const [expandedPrinciple, setExpandedPrinciple] = useState<number | null>(null)
  const [lessonOutlines, setLessonOutlines] = useState<Record<number, LessonOutline | null>>({})
  const [loadingLessons, setLoadingLessons] = useState<Record<number, boolean>>({})

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

  const handleStartLesson = async (lessonNumber: number) => {
    if (loadingLessons[lessonNumber] || lessonOutlines[lessonNumber]) return;

    setLoadingLessons(prev => ({ ...prev, [lessonNumber]: true }))

    try {
      const response = await fetch('/api/generateLesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          background,
          goals: goals.map(goal => goal.content).filter(Boolean),
          core_principles: grokData?.corePrinciples,
          lesson_plan: grokData?.lessonPlans?.lesson_plans.find(lp => lp.lesson_number === lessonNumber)
        }),
      })
      const lessonOutline = await response.json()
      console.log("Received lesson outline:", lessonOutline)
      setLessonOutlines(prev => ({ ...prev, [lessonNumber]: lessonOutline }))
    } catch (error) {
      console.error('Error generating lesson:', error)
    } finally {
      setLoadingLessons(prev => ({ ...prev, [lessonNumber]: false }))
    }
  }

  const renderLatex = (text: string) => {
    // Split the text into LaTeX and non-LaTeX parts
    const parts = text.split(/(\$[^\$]+\$|\$\$[^\$]+\$\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        // Render inline LaTeX
        return <Latex key={index}>{part}</Latex>;
      } else if (part.startsWith('$$') && part.endsWith('$$')) {
        // Render block LaTeX
        return <Latex key={index}>{part}</Latex>;
      } else {
        // Return regular text
        return part;
      }
    });
  };

  const customRenderers: Partial<ExtendedComponents> = {
    inlineMath: ({value}) => <Latex>{`$${value}$`}</Latex>,
    math: ({value}) => <Latex>{`$$${value}$$`}</Latex>,
    p: ({children}) => <p>{renderLatex(String(children))}</p>,
    details: ({children}) => <details>{children}</details>,
    summary: ({children}) => <summary>{children}</summary>,
    li: ({ children, ordered, ...props }) => {
      if (Array.isArray(children)) {
        // Handle the case where children is an array
        const content = children.map((child, index) => {
          if (typeof child === 'object' && child !== null && 'content' in child) {
            return <span key={index}>{child.content}</span>;
          }
          return <span key={index}>{child}</span>;
        });
        return <li {...props}>{content}</li>;
      }
      // Handle the case where children is a single object or string
      if (typeof children === 'object' && children !== null && 'content' in children) {
        return <li {...props}>{children.content}</li>;
      }
      return <li {...props}>{children}</li>;
    },
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Grok Tuah Learning System</h1>
      {!grokData ? (
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
                <p>{grokData.corePrinciples?.introduction}</p>
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
                <ul className="space-y-4">
                  {grokData.corePrinciples?.principles.map((principle) => (
                    <li key={principle.sequence_number} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div 
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => setExpandedPrinciple(expandedPrinciple === principle.sequence_number ? null : principle.sequence_number)}
                      >
                        <h3 className="text-lg font-semibold">{principle.principle}</h3>
                        <Button variant="ghost" size="sm">
                          {expandedPrinciple === principle.sequence_number ? 'Hide' : 'Expand'}
                        </Button>
                      </div>
                      {expandedPrinciple === principle.sequence_number && (
                        <div className="mt-2">
                          <p className="text-gray-600 mb-2">{principle.brief_explanation}</p>
                          {/* <h4 className="font-semibold mt-2">Learning Objectives:</h4>
                          <ul className="list-disc pl-5">
                            {principle.learning_objectives.map((objective, index) => (
                              <li key={index}>{objective}</li>
                            ))}
                          </ul> */}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              {lessonPlansLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : grokData?.lessonPlans ? (
                <Tabs defaultValue={grokData.lessonPlans.lesson_plans[0].lesson_number.toString()} className="w-full">
                  <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4">
                    {grokData.lessonPlans.lesson_plans.map((lesson) => (
                      <TabsTrigger key={lesson.lesson_number} value={lesson.lesson_number.toString()}>
                        Lesson {lesson.lesson_number}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {grokData.lessonPlans.lesson_plans.map((lesson) => (
                    <TabsContent key={lesson.lesson_number} value={lesson.lesson_number.toString()} className="mt-4">
                      <div className="w-full">
                        {!lessonOutlines[lesson.lesson_number] && !loadingLessons[lesson.lesson_number] && (
                          <>
                            <h3 className="text-xl font-semibold">{lesson.lesson_name}</h3>
                            <p>{lesson.lesson_objectives}</p>
                            <Button onClick={() => handleStartLesson(lesson.lesson_number)}>
                              Start Lesson
                            </Button>
                          </>
                        )}
                        {loadingLessons[lesson.lesson_number] && (
                          <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                        )}
                        {lessonOutlines[lesson.lesson_number] && (
                          <div className="w-full prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
                            {console.log("Rendering lesson outline:", lessonOutlines[lesson.lesson_number])}
                            <ReactMarkdown 
                              components={customRenderers}
                              rehypePlugins={[rehypeRaw]}
                            >
                              {lessonOutlines[lesson.lesson_number]?.content || ''}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}