'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronDown, ChevronLeft, Book, Home, Trash2, Sun, Moon } from 'lucide-react'
import { Grok } from '@/lib/types'
import { getRootGroks, getChildGroks } from '@/lib/storage'
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

type GrokTreeNode = {
  id: string
  concept: string
  children: GrokTreeNode[]
}

export function GrokSidebar() {
  const [grokTree, setGrokTree] = useState<GrokTreeNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const fetchGrokTree = async () => {
    const rootGroks = await getRootGroks()
    const tree = await Promise.all(rootGroks.map(async grok => ({
      id: grok.id,
      concept: grok.concept,
      children: await fetchChildren(grok.id)
    })))
    setGrokTree(tree)
  }

  const fetchChildren = async (parentId: string): Promise<GrokTreeNode[]> => {
    const childGroks = await getChildGroks(parentId)
    return await Promise.all(childGroks.map(async childGrok => ({
      id: childGrok.id,
      concept: childGrok.concept,
      children: await fetchChildren(childGrok.id)
    })))
  }

  useEffect(() => {
    fetchGrokTree()
    
    // Set up an interval to periodically check for updates
    const intervalId = setInterval(fetchGrokTree, 1000)
    
    return () => clearInterval(intervalId)
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const renderGrokTree = (nodes: GrokTreeNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id} style={{ paddingLeft: `${depth * 16}px` }}>
        <div className="flex items-center py-2 hover:bg-accent/50 rounded-md transition-colors duration-200">
          <button 
            onClick={() => toggleExpand(node.id)} 
            className="mr-2 text-muted-foreground hover:text-foreground"
          >
            {node.children.length > 0 && (
              expandedNodes.has(node.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            )}
          </button>
          <Link href={`/grok/${node.id}`} className="text-foreground hover:text-foreground flex items-center">
            <Book size={16} className="mr-2" />
            {decodeURIComponent(node.concept)}
          </Link>
        </div>
        {expandedNodes.has(node.id) && renderGrokTree(node.children, depth + 1)}
      </div>
    ))
  }

  const clearData = () => {
    localStorage.clear()
    setGrokTree([])
    setExpandedNodes(new Set())
    router.push('/')
  }

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-background border-r border-border text-foreground transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } overflow-y-auto z-50 flex flex-col`}
    >
      <div className="flex justify-between items-center p-4">
        {!isCollapsed && <h2 className="text-xl font-bold">Grok Navigation</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      {!isCollapsed && (
        <>
          <Link href="/" className="flex items-center p-2 hover:bg-accent/50 rounded-md transition-colors duration-200">
            <Home size={16} className="mr-2" />
            Home
          </Link>
          <div className="flex-grow overflow-y-auto px-2">
            {renderGrokTree(grokTree)}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="mb-2 mx-2"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={clearData}
            className="m-2 mt-auto"
          >
            <Trash2 size={16} className="mr-2" />
            Clear Data
          </Button>
        </>
      )}
    </div>
  )
}