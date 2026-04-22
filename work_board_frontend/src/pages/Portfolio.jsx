const projects = [
  {
    id: 1,
    title: '워크보드',
    description: '개인 블로그 및 포트폴리오 웹사이트',
    stack: ['React', 'FastAPI', 'PostgreSQL'],
    url: 'https://github.com',
  },
  {
    id: 2,
    title: '프로젝트 2',
    description: '프로젝트 설명을 입력하세요',
    stack: ['Python', 'Docker'],
    url: 'https://github.com',
  },
]

export default function Portfolio() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-bold text-[#1F2328]">포트폴리오</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <a
            key={project.id}
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col rounded-md border border-[#D0D7DE] bg-white p-5 hover:border-[#0969DA] hover:shadow-sm transition-all"
          >
            <h2 className="mb-2 text-base font-semibold text-[#1F2328]">{project.title}</h2>
            <p className="mb-4 flex-1 text-sm text-[#636C76]">{project.description}</p>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-[#D0D7DE] bg-[#F6F8FA] px-2 py-0.5 text-xs text-[#636C76]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
