import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NoteNotFound() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Note Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The note you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Link href="/notes">
            <Button>Back to Notes</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
