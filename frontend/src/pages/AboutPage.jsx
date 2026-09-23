import React from 'react';
import { ShieldCheck, GraduationCap, Users, BookOpen, Award, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';

const TEAM_MEMBERS = [
  {
    name: 'Yaseen Jamshed',
    roll: '2501320140158',
    role: 'Backend, Programming & Core Architecture',
    tools: 'FastAPI, Pydantic, Uvicorn ASGI, Python Services',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    name: 'Vandana',
    roll: '2501320140151',
    role: 'Frontend Engineering & UI/UX Design',
    tools: 'React.js, Tailwind CSS, Axios, Lucide Icons, Recharts',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    name: 'Aarti Vishwakarma',
    roll: '2501320140001',
    role: 'AI & Machine Learning Layer',
    tools: 'OpenAI API, Anthropic API, Groq Llama-3, LangChain',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    name: 'Soni',
    roll: '2501320140140',
    role: 'Database & Relational Storage',
    tools: 'PostgreSQL, SQLAlchemy, ChromaDB Vector Store',
    color: 'from-purple-500 to-pink-500'
  }
];

const REFERENCES = [
  {
    author: 'Rodríguez Castillo, N. E., Mendoza Carrera, J. E., Andrade-Vásquez, M. M., & Acosta-Barreno, K. (2026)',
    title: 'Media literacy education and misinformation in social media among adolescents: A systematic review and meta-analysis.',
    journal: 'Journalism and Media, 7(2), 71.'
  },
  {
    author: 'Ozcelik, O., Toraman, C., & Can, F. (2025)',
    title: 'Detecting misinformation on social media using community insights and contrastive learning.',
    journal: 'ACM Transactions on Intelligent Systems and Technology, 16(2), 1-27.'
  },
  {
    author: 'Tomassi, A., Falegnami, A., & Romano, E. (2024)',
    title: 'Mapping automatic social media information disorder: The role of bots and AI in spreading misleading information in society.',
    journal: 'PLOS ONE, 19(5), e0303183.'
  },
  {
    author: 'Aïmeur, E., Amri, S., & Brassard, G. (2023)',
    title: 'Fake news, disinformation and misinformation on social media: a review.',
    journal: 'Social Network Analysis and Mining, 13(1), 30.'
  },
  {
    author: 'Muhammed T, S., & Mathew, S. K. (2022)',
    title: 'The disaster of misinformation: a review of research in social media.',
    journal: 'International Journal of Data Science and Analytics, 13(4), 271-285.'
  },
  {
    author: 'Di Domenico, G., Sit, J., Ishizaka, A., & Nunan, D. (2021)',
    title: 'Fake news, social media and marketing: A systematic review.',
    journal: 'Journal of Business Research, 124, 329-341.'
  }
];

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Synopsis Academic Banner */}
      <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-cyan-500/30 text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" />
          <span>MCA Major Project Synopsis (2025–2027)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Social Media & Misleading Information
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Submitted in partial fulfillment of the requirements for the degree of <br />
          <strong className="text-white">Master of Computer Application (MCA)</strong>
        </p>
        <div className="pt-2 text-xs sm:text-sm text-slate-400">
          <span className="text-slate-300 font-semibold">Department of Computer Application (DCA)</span><br />
          Greater Noida Institute of Technology (Engg. Institute)<br />
          Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow
        </div>
      </div>

      {/* Project Guidance */}
      <div className="max-w-xl mx-auto p-6 rounded-2xl glass-panel border border-white/10 text-center space-y-2">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Under the Guidance of:</span>
        <h3 className="text-xl font-bold text-cyan-400">Dr. Saumya Chaturvedi</h3>
        <p className="text-xs text-slate-400">Department of Computer Application, GNIOT</p>
      </div>

      {/* Project Team & Responsibilities */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Project Roles & Division of Work
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            The Student Development Team
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Directly mapping responsibilities specified in Synopsis Page 9.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM_MEMBERS.map((member, idx) => (
            <div key={idx} className="p-6 rounded-2xl glass-panel border border-white/10 space-y-3 flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${member.color} flex items-center justify-center text-white font-bold text-lg mb-3 shadow-lg`}>
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-base font-bold text-white">{member.name}</h3>
                <span className="text-xs text-cyan-400 font-mono block mb-2">{member.roll}</span>
                <p className="text-xs font-semibold text-slate-300 mb-1">{member.role}</p>
              </div>

              <div className="border-t border-white/5 pt-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Tools & Frameworks:</span>
                <p className="text-[11px] text-slate-400">{member.tools}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Literature Review References */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Literature Review & Research Citations
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          The theoretical framework of TruthShield is grounded in peer-reviewed studies cataloged in the MCA Synopsis (Page 10):
        </p>

        <div className="space-y-3">
          {REFERENCES.map((ref, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-dark-900/80 border border-white/5 space-y-1 text-xs">
              <p className="text-slate-200 font-medium">
                {ref.author}
              </p>
              <p className="text-cyan-400 font-semibold italic">
                "{ref.title}"
              </p>
              <p className="text-slate-500">
                {ref.journal}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
