import { Suspense } from "react"
import TasksContent from "@/components/dashboard/tasks-content"

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksLoadingFallback />}>
      <TasksContent />
    </Suspense>
  )
}

function TasksLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"></div>
        </div>
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    </div>
  )
}
