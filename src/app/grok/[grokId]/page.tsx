'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from 'react-markdown'
import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'
import rehypeRaw from 'rehype-raw'
import { Components } from 'react-markdown'
import { GrokSidebar } from '@/components/GrokSidebar'
import { Grok, Principle, LessonOutline, CorePrinciples, LessonPlans } from '@/lib/types'
import { getGrok, updateGrok, createGrok } from '@/lib/storage'

type ExtendedComponents = Components & {
  inlineMath: React.ComponentType<{ value: string }>
  math: React.ComponentType<{ value: string }>
}

export default function GrokPage({ params }: { params: { grokId: string } }) {
  const [grok, setGrok] = useState<Grok | null>(null)
  const [expandedPrinciple, setExpandedPrinciple] = useState<number | null>(null)
  const [loadingCurriculum, setLoadingCurriculum] = useState(false)
  const [loadingLessonPlans, setLoadingLessonPlans] = useState(false)
  const [lessonOutlines, setLessonOutlines] = useState<Record<number, LessonOutline | null>>({})
  const [loadingLessons, setLoadingLessons] = useState<Record<number, boolean>>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const [decodedConcept, setDecodedConcept] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadGrok = async () => {
      setIsLoading(true)
      const concept = searchParams.get('concept') || ''
      const decoded = decodeURIComponent(concept)
      setDecodedConcept(decoded)

      if (params.grokId === 'new') {
        const newGrok: Grok = {
          id: `grok_${Date.now()}`,
          concept: concept,
          background: searchParams.get('background') || '',
          goals: searchParams.get('goals')?.split(',') || [],
          corePrinciples: null,
          lessonPlans: null,
          lessonOutlines: {},
          parentGrokId: null,
        }
        createGrok(newGrok)
        setGrok(newGrok)
        generateCurriculum(newGrok)
      } else {
        const loadedGrok = getGrok(params.grokId)
        if (loadedGrok) {
          setGrok(loadedGrok)
          if (!loadedGrok.corePrinciples) {
            generateCurriculum(loadedGrok)
          }
          if (!loadedGrok.lessonPlans) {
            generateLessonPlans(loadedGrok)
          }
        } else {
          router.push('/')
        }
      }
      setIsLoading(false)
    }

    loadGrok()
  }, [params.grokId, router, searchParams])

  const generateCurriculum = async (currentGrok: Grok) => {
    setLoadingCurriculum(true)
    try {
      const response = await fetch('/api/generateCurriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: currentGrok.concept,
          background: currentGrok.background,
          goals: currentGrok.goals,
        }),
      })
      const corePrinciples: CorePrinciples = await response.json()
      const updatedGrok = { ...currentGrok, corePrinciples }
      updateGrok(updatedGrok.id, updatedGrok)
      setGrok(updatedGrok)
      generateLessonPlans(updatedGrok)
    } catch (error) {
      console.error('Error generating curriculum:', error)
    } finally {
      setLoadingCurriculum(false)
    }
  }

  const generateLessonPlans = async (currentGrok: Grok) => {
    if (!currentGrok.corePrinciples) return
    setLoadingLessonPlans(true)
    try {
      const response = await fetch('/api/generateLessonPlans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: currentGrok.concept,
          background: currentGrok.background,
          goals: currentGrok.goals,
          corePrinciples: currentGrok.corePrinciples,
        }),
      })
      const lessonPlans: LessonPlans = await response.json()
      const updatedGrok = { ...currentGrok, lessonPlans }
      updateGrok(updatedGrok.id, updatedGrok)
      setGrok(updatedGrok)
    } catch (error) {
      console.error('Error generating lesson plans:', error)
    } finally {
      setLoadingLessonPlans(false)
    }
  }

  const handleStartLesson = async (lessonNumber: number) => {
    if (loadingLessons[lessonNumber] || lessonOutlines[lessonNumber] || !grok || !grok.corePrinciples || !grok.lessonPlans) return

    setLoadingLessons(prev => ({ ...prev, [lessonNumber]: true }))

    try {
      const response = await fetch('/api/generateLesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: grok.concept,
          background: grok.background,
          goals: grok.goals,
          core_principles: grok.corePrinciples,
          lesson_plan: grok.lessonPlans.lesson_plans.find(lp => lp.lesson_number === lessonNumber)
        }),
      })
      const lessonOutline = await response.json()
      setLessonOutlines(prev => ({ ...prev, [lessonNumber]: lessonOutline }))
      
      const updatedGrok = {
        ...grok,
        lessonOutlines: {
          ...grok.lessonOutlines,
          [lessonNumber]: lessonOutline
        }
      }
      updateGrok(grok.id, updatedGrok)
      setGrok(updatedGrok)
    } catch (error) {
      console.error('Error generating lesson:', error)
    } finally {
      setLoadingLessons(prev => ({ ...prev, [lessonNumber]: false }))
    }
  }

  const handlePrincipleClick = (principle: Principle) => {
    if (!grok) return

    const childGrokId = `${grok.id}_${principle.sequence_number}`
    const childGrok: Grok = {
      id: childGrokId,
      concept: principle.principle,
      background: grok.background,
      goals: principle.learning_objectives,
      corePrinciples: null,
      lessonPlans: null,
      lessonOutlines: {},
      parentGrokId: grok.id,
    }
    
    createGrok(childGrok)
    router.push(`/grok/${childGrokId}`)
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
    li: ({ children, ...props }) => {
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
        return <li {...props}>{(children as { content: React.ReactNode }).content}</li>;
      }
      return <li {...props}>{children}</li>;
    },
  }

  if (!grok || isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4 bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-8">{grok?.concept ? decodeURIComponent(grok.concept) : 'Loading...'}</h1>
      <div className="space-y-8">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Introduction</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCurriculum ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : grok.corePrinciples ? (
              <p>{grok.corePrinciples.introduction}</p>
            ) : (
              <p>No introduction available</p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Core Principles</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCurriculum ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : grok.corePrinciples ? (
              <ul className="space-y-4">
                {grok.corePrinciples.principles.map((principle) => (
                  <li key={principle.sequence_number} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <button 
                        className="text-primary hover:underline text-left"
                        onClick={() => handlePrincipleClick(principle)}
                      >
                        {principle.principle}
                      </button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setExpandedPrinciple(expandedPrinciple === principle.sequence_number ? null : principle.sequence_number)}
                      >
                        {expandedPrinciple === principle.sequence_number ? 'Hide' : 'Expand'}
                      </Button>
                    </div>
                    {expandedPrinciple === principle.sequence_number && (
                      <p className="mt-2 text-muted-foreground">{principle.brief_explanation}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No principles available</p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLessonPlans ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : grok.lessonPlans ? (
              <Tabs defaultValue={grok.lessonPlans.lesson_plans[0].lesson_number.toString()} className="w-full">
                <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4">
                  {grok.lessonPlans.lesson_plans.map((lesson) => (
                    <TabsTrigger key={lesson.lesson_number} value={lesson.lesson_number.toString()}>
                      Lesson {lesson.lesson_number}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {grok.lessonPlans.lesson_plans.map((lesson) => (
                  <TabsContent key={lesson.lesson_number} value={lesson.lesson_number.toString()} className="mt-4">
                    <div className="w-full">
                      <h3 className="text-xl font-semibold">{lesson.lesson_name}</h3>
                      <p>{lesson.lesson_objectives}</p>
                      {!lessonOutlines[lesson.lesson_number] && !loadingLessons[lesson.lesson_number] && (
                        <Button onClick={() => handleStartLesson(lesson.lesson_number)} className="mt-4">
                          Start Lesson
                        </Button>
                      )}
                      {loadingLessons[lesson.lesson_number] && (
                        <div className="flex justify-center mt-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}
                      {lessonOutlines[lesson.lesson_number] && (
                        <div className="w-full prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none mt-4 dark:prose-invert">
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
            ) : (
              <p>No lessons available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}