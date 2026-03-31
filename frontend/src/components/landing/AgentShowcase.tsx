import { Code, FileText, GitBranch, Search, Shield, TestTubes } from 'lucide-react';
import { AgentCard } from '@/components/shared/AgentCard';

const agents = [
  {
    icon: Code,
    name: 'SRS',
    description:
      'AI로 시작하는 SRS생성, 요구사항을 입력하시면 더 빠르고 간편하게 SRS를 만들어 드립니다. 당신의 시작을 도와드립니다.',
  },
  {
    icon: Search,
    name: 'Test Case',
    description:
      'AI로 시작하는 TestCase생성, SRS를 입력하시면 더 빠르고 간편하게 TestCase를 만들어 드립니다. 당신의 시작을 도와드립니다.',
  },
  {
    icon: FileText,
    name: 'Design',
    description:
      '소스코드로부터 소프트웨어 아키텍처의 모듈 뷰(Module View)에 대한 내용을 문서로 생성해주는 역할을 수행하며 해당 기능은 SAVE를 통해서 제공됩니다.',
  },
  {
    icon: TestTubes,
    name: 'Open Source',
    description:
      '소스코드, 바이너리, 디펜던시에 대한 Open Source 분석을 수행하고, 검출된 Open Source 정보를 Report 형태로 추출하는 서비스입니다.',
  },
  {
    icon: GitBranch,
    name: '정적 분석',
    description: 'AI로 Repository내 정적분석 결함을 수정하여 생성된 Change를 확인할 수 있습니다.',
  },
  {
    icon: Shield,
    name: '보안 취약점',
    description:
      '다양한 동적·정적 분석 기술을 활용해 소프트웨어 보안 취약점을 진단하는 도구이며 해당 기능은 VulDOC을 통해 제공됩니다.',
  },
];

export function AgentShowcase() {
  return (
    <section className='flex flex-col items-center gap-2.5 px-4 pb-6 sm:px-8 md:px-12'>
      <div className='border-line-subtle flex items-center gap-2 rounded-full border px-4 py-1.5'>
        <span className='bg-accent-primary h-1.5 w-1.5 rounded-full' />
        <span className='text-fg-secondary text-xs tracking-wide'>AI Agents</span>
      </div>
      <div className='grid w-full max-w-[960px] grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3'>
        {agents.map((agent) => (
          <AgentCard key={agent.name} {...agent} />
        ))}
      </div>
    </section>
  );
}
