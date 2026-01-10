import { Suspense } from "react"
import ProjectsContent from "@/components/dashboard/projects-content"

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsLoadingFallback />}>
      <ProjectsContent />
    </Suspense>
  )
}

function ProjectsLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"></div>
        </div>
        <p className="text-muted-foreground font-medium">Loading projects...</p>
      </div>
    </div>
  )
}
