type WorkspaceOverviewProps = {
  experience: 'creator' | 'community'
}

const workspaceContent = {
  creator: {
    eyebrow: 'CREATOR WORKSPACE',
    title: 'Your stage is taking shape.',
    description:
      'This is the foundation for creator tools. Competition management and channel connections will be introduced in later phases.',
  },
  community: {
    eyebrow: 'COMMUNITY WORKSPACE',
    title: 'The crowd belongs in the arena.',
    description:
      'This is the foundation for community experiences. Competition discovery and participation will be introduced in later phases.',
  },
} as const

export function WorkspaceOverview({ experience }: WorkspaceOverviewProps) {
  const content = workspaceContent[experience]

  return (
    <section aria-labelledby="workspace-title" className="workspace-intro">
      <p className="eyebrow">{content.eyebrow} <span>·</span> FOUNDATION</p>
      <h1 id="workspace-title">{content.title}</h1>
      <p className="workspace-description">{content.description}</p>
      <p className="workspace-scope">
        No account connection or live competition data is active in this preview.
      </p>
    </section>
  )
}
