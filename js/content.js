/* ==========================================================================
   TeamHub presentation: ALL editable content lives in this file.
   Plain script (no modules) so it works from file://.

   HOW TO EDIT
   - Replace MEMBER_1..MEMBER_10, SUPERVISOR_NAME, UNIVERSITY, FACULTY below.
   - Words wrapped in *stars* inside a headline get the underline sweep.
   - Emulator scenes (the "scene" arrays) are small scripts. Coordinates are
     in IMAGE percent: [x%, y%] of the screenshot itself (0,0 = top-left,
     100,100 = bottom-right). So they stay correct on any screenshot size.
       {swap:'kanban.png'}            switch screenshot (always start a scene with it)
       {scroll:40, ms:1400}           scroll so that 40% of the image height is at the top
       {zoom:[x,y,1.6], ms:1200}      camera push-in to a point
       {unzoom:true}                  camera pull-back
       {moveTo:[x,y]}                 finger glides along a curved path
       {tap:true}                     press + ripple (at the current finger position)
       {tapAt:[x,y]}                  moveTo + tap in one command
       {highlight:[x,y,w,h]}          spotlight + glowing ring (w,h in image %)
       {highlight:null}               remove the spotlight
       {callout:'Text', at:[x,y]}     pill badge that pops in beside the phone
       {type:{at:[x,y,w], text:'..'}} typing caret overlay
       {pulse:[x,y]}                  soft pulse on a spot
       {clear:true}                   remove callouts + spotlight
       {wait:800}                     pause (ms)
   ========================================================================== */

window.CONTENT = {

  /* ---------- Identity / placeholders ---------- */
  supervisor: 'DR- SARA SHEHAB',
  university: 'DTU',
  faculty: 'IT',

  /* Closing video (put the file in assets/vedios/). The name is set ONLY here. */
  closingVideo: 'thank-you.mp4',
  closingVideoFolder: 'assets/vedios/',

  /* Team: member i presents section i (MEMBER_1 also opens + closes). */
  team: [
    { name: 'AHMED MOURAD', role: 'ROLE' },
    { name: 'MOHAMED SALAMA', role: 'ROLE' },
    { name: 'ABDELAWAHED ALAA', role: 'ROLE' },
    { name: 'MOHAMED YASSER', role: 'ROLE' },
    { name: 'MAZEN EL SAYED', role: 'ROLE' },
    { name: 'HASSAN MOHAMED', role: 'ROLE' },
    { name: 'NADA IBRAHIM', role: 'ROLE' },
    { name: 'DOUAA', role: 'ROLE' },
    { name: 'SALMA SHAABAN', role: 'ROLE' },
    { name: 'WAFFA ALY', role: 'ROLE' }
  ],

  meetTeamTitle: 'Meet the *team*',

  /* ---------- Screens (assets/screens/) ---------- */
  screensFolder: 'assets/screens/',
  /* Screenshots that exist in assets/screens/. When you add a new screenshot,
     add its file name here. Anything not listed falls back to screenFallbacks
     and then to a clean labelled placeholder (no console errors). */
  screenFiles: [
    'dashboard.png', 'chaos-chat.png', 'chaos-folder.png', 'roles.png',
    'challenge-denied.png', 'solved-sync.png', 'kanban.png', 'kanban-2.png',
    'files.png', 'versions.png', 'supervisor.png', 'mobile.png'
  ],
  /* If a screenshot file is missing, try this one before showing a placeholder. */
  screenFallbacks: {
    'analytics.png': 'dashboard.png',
    'challenge-conflict.png': 'versions.png',
    'roles-student.png': 'roles.png',
    'roles-leader.png': 'roles.png',
    'roles-supervisor.png': 'supervisor.png'
  },
  /* Section -> screens (used for preloading; scenes below decide the order). */
  sectionScreens: {
    s01: ['dashboard.png'],
    s02: ['chaos-chat.png', 'chaos-folder.png'],
    s03: ['roles.png', 'roles-leader.png', 'roles-supervisor.png'],
    s04: ['dashboard.png', 'challenge-conflict.png', 'chaos-chat.png', 'challenge-denied.png'],
    s05: ['solved-sync.png'],
    s06: ['kanban.png', 'kanban-2.png'],
    s07: ['files.png', 'versions.png'],
    s08: ['analytics.png', 'supervisor.png'],
    s09: ['dashboard.png', 'mobile.png'],
    s10: ['dashboard.png']
  },

  /* ---------- The 10 sections ----------
     steps[0] is what you see when the section starts; every extra entry is one
     clicker press. Each step may set:
       phone: 'center' | 'right' | 'rightSmall' | 'focus' | 'coming' | 'hidden'
       scene: [ ...emulator commands... ]                                       */
  /* ---------- Section presenter labels ---------- */
  /* index 0=s01 .. 9=s10 */
  sectionPresenters: [
    'حسن محمد',     /* s01 – Meet TeamHub / The Problem          */
    'حسن محمد',     /* s02 – The Problem (stats + chaos)          */
    'محمد سلامه',   /* s03 – Vision and Users                     */
    'سلمى شعبان',   /* s04 – The Challenges                       */
    'سلمى شعبان',   /* s05 – How We Solved Them                   */
    'ندى ابراهيم',  /* s06 – Tasks and Workflow                   */
    'ندى ابراهيم',  /* s07 – Files and Version History            */
    'دعاء',         /* s08 – Contribution + Supervisor View       */
    'عبدالواحد علاء / محمد ياسر', /* s09 – AI + Architecture       */
    'مازن السيد'    /* s10 – Current Status + Future Roadmap      */
  ],

  sections: [

    /* 01 ---------------------------------------------------------------- */
    {
      id: 's01', title: 'Meet TeamHub', theme: 'light',
      headline: 'One hub for your entire *graduation project.*',
      sub: 'For university students, dev teams and academic supervisors.',
      points: ['Students', 'Dev teams', 'Academic supervisors'],
      bridge: 'But why does a team need a hub at all? Let\u2019s look at what happens without one.',
      steps: [
        { phone: 'center', scene: [{ swap: 'dashboard.png' }, { boot: true }, { wait: 500 }] },
        {
          phone: 'right', scene: [
            { swap: 'dashboard.png' }, { wait: 500 },
            { scroll: 30, ms: 2200 }, { moveTo: [80, 42] }, { highlight: [8, 41, 84, 5] },
            { tap: true }, { callout: 'Open your project workspace', at: [70, 42] }, { wait: 900 },
            { clear: true }, { scroll: 0, ms: 1400 }]
        },
        { phone: 'right' },
        { phone: 'right' }
      ]
    },

    /* 02 ---------------------------------------------------------------- */
    {
      id: 's02', title: 'The problem', theme: 'light',
      headline: 'Without a hub, teams work in *chaos.*',
      points: [
        'Chats buried in WhatsApp groups',
        'Files scattered across Drive, named final_v3_REAL',
        'No one knows who did what, and supervisors cannot see progress'
      ],
      /* Floating mess behind the story. type: bubble | file | note */
      chaos: [
        { t: 'bubble', text: 'Who has the latest file?' },
        { t: 'file', text: 'final_v3_REAL.docx' },
        { t: 'note', text: 'Deadline??' },
        { t: 'bubble', text: 'Meeting at 5?' },
        { t: 'file', text: 'report_FINAL (2).pdf' },
        { t: 'note', text: 'Who did this part?' },
        { t: 'bubble', text: 'Did anyone push?' },
        { t: 'file', text: 'budget_old_NEW.xlsx' },
        { t: 'note', text: 'Check Drive' },
        { t: 'bubble', text: 'Sorry, wrong group' }
      ],
      /* Real figures. Do not round or change. */
      stats: [
        {
          value: 39.65, decimals: 2, prefix: '', suffix: '%', n: 'n=58',
          label: 'of students named lack of technical knowledge of Git/GitHub as their main difficulty',
          source: 'Experiences and insights from using GitHub Classroom to support Project-Based Courses (arXiv 2103.07242)'
        },
        {
          value: 20, decimals: 0, prefix: '~', suffix: '%', n: 'n=171',
          label: 'report free riders in group work \u201Cusually\u201D or \u201Calways\u201D',
          source: 'Phan, Journal of Information Systems Education (1990s data)'
        },
        {
          value: 47, decimals: 0, prefix: '', suffix: '%', n: 'n=171',
          label: 'cite finding a convenient meeting time as a frequent or constant problem',
          source: 'Phan, Journal of Information Systems Education (1990s data)'
        }
      ],
      bridge: 'So we set a clear goal: replace the chaos with one organized place.',
      steps: [
        { phone: 'right', scene: [{ swap: 'chaos-chat.png' }, { wait: 700 }, { scroll: 28, ms: 2600 }] },
        {
          phone: 'right', scene: [
            { swap: 'chaos-folder.png' }, { wait: 400 }, { scroll: 10, ms: 1800 },
            { callout: 'Which version is the real one?', at: [60, 24] }, { wait: 900 }]
        },
        { phone: 'rightSmall', scene: [{ swap: 'chaos-folder.png' }, { clear: true }, { scroll: 0, ms: 1200 }] },
        { phone: 'rightSmall' }
      ]
    },

    /* 03 ---------------------------------------------------------------- */
    {
      id: 's03', title: 'Vision and users', theme: 'light',
      headline: 'One place. *Three* kinds of users.',
      goal: 'Our goal: one organized place for every project.',
      users: [
        { name: 'Students', gets: 'See your tasks, files and progress in one place.' },
        { name: 'Team Leaders', gets: 'Plan work, assign tasks and keep the team moving.' },
        { name: 'Academic Supervisors', gets: 'Follow progress and evaluate with real data.' }
      ],
      bridge: 'Great idea on paper. Building it was not easy.',
      steps: [
        { phone: 'right', scene: [{ swap: 'roles.png' }, { wait: 500 }] },
        {
          phone: 'right', scene: [
            { swap: 'roles.png' }, { moveTo: [86, 5] }, { highlight: [74, 3, 22, 3] },
            { tap: true }, { callout: 'Switch role', at: [86, 5] }, { wait: 700 },
            { swap: 'roles-leader.png' }, { wait: 500 },
            { moveTo: [50, 32] }, { clear: true }, { scroll: 18, ms: 1600 }, { wait: 500 },
            { swap: 'roles-supervisor.png' }, { scroll: 0, ms: 600 }]
        },
        { phone: 'right' }
      ]
    },

    /* 04 ---------------------------------------------------------------- */
    {
      id: 's04', title: 'The challenges', theme: 'dark',
      headline: 'Four challenges we had to *solve.*',
      challenges: [
        'Tracking each member\u2019s contribution fairly',
        'Versioning files and tasks (history, compare, restore)',
        'Real-time synchronization between team members',
        'Roles and permissions (student / leader / supervisor)'
      ],
      bridge: 'Every challenge became a design decision. Here is how we solved them.',
      steps: [
        { phone: 'right', scene: [{ swap: 'dashboard.png' }] },
        {
          phone: 'right', scene: [{ swap: 'dashboard.png' }, { scroll: 66, ms: 1800 },
          { callout: 'Who did what?', at: [30, 80] }, { highlight: [6, 74, 88, 12] }, { wait: 800 }]
        },
        {
          phone: 'right', scene: [{ swap: 'challenge-conflict.png' }, { clear: true }, { scroll: 40, ms: 1400 },
          { callout: 'Two versions, one file', at: [50, 55] }, { wait: 800 }]
        },
        {
          phone: 'right', scene: [{ swap: 'chaos-chat.png' }, { clear: true }, { scroll: 40, ms: 1200 },
          { callout: 'Is everyone seeing this?', at: [55, 62] }, { wait: 800 }]
        },
        {
          phone: 'right', scene: [{ swap: 'challenge-denied.png' }, { clear: true }, { scroll: 0, ms: 900 },
          { callout: 'Access denied for this role', at: [50, 14] }, { wait: 800 }]
        },
        { phone: 'right', scene: [{ clear: true }] }
      ]
    },

    /* 05 ---------------------------------------------------------------- */
    {
      id: 's05', title: 'How we solved them', theme: 'dark',
      headline: 'Every challenge became a *design decision.*',
      /* Same order as the challenges in section 04. */
      solutions: [
        { title: 'Contribution', text: 'Every action (task done, file upload, review) is logged as an activity event and weighted into a per-member contribution score.' },
        { title: 'Versioning', text: 'Immutable snapshots stored per file and task, with compare and one-click restore.' },
        { title: 'Real-time', text: 'Firestore live listeners push updates instantly to all members.' },
        { title: 'Roles', text: 'Role-based access enforced in the ASP.NET Core API and mirrored in Firestore security rules.' }
      ],
      bridge: 'With the foundation solid, let\u2019s see what a team actually does inside TeamHub.',
      steps: [
        { phone: 'right', scene: [{ swap: 'solved-sync.png' }, { clear: true }, { scroll: 0, ms: 900 }] },
        { phone: 'right' },
        { phone: 'right' },
        {
          phone: 'right', scene: [{ swap: 'solved-sync.png' }, { moveTo: [50, 20] },
          { callout: 'Up to date', at: [50, 8] }, { pulse: [50, 8] }, { wait: 900 }]
        },
        { phone: 'right' },
        { phone: 'right', scene: [{ clear: true }] }
      ]
    },

    /* 06 ---------------------------------------------------------------- */
    {
      id: 's06', title: 'Tasks and workflow', theme: 'light',
      headline: 'Tasks that keep the project *moving.*',
      columns: ['To Do', 'In Progress', 'Review', 'Done'],
      points: ['Assignees, deadlines and priorities', 'Comments on every task', 'A clear state for every card'],
      bridge: 'Tasks move forward, and so do the files and versions behind them.',
      steps: [
        { phone: 'right', scene: [{ swap: 'kanban.png' }, { clear: true }, { scroll: 0, ms: 600 }] },
        {
          phone: 'focus', scene: [
            { swap: 'kanban.png' }, { wait: 500 }, { scroll: 55, ms: 2000 },
            { moveTo: [30, 74] }, { highlight: [4, 71, 92, 6] }, { tap: true },
            { zoom: [50, 75, 1.45], ms: 1400 },
            { callout: 'Assign a member', at: [20, 74] }, { wait: 800 },
            { moveTo: [82, 79] }, { tap: true },
            { swap: 'kanban-2.png' }, { pulse: [82, 79] },
            { callout: 'Moved to Review', at: [82, 79] }, { wait: 900 },
            { clear: true }, { unzoom: true, ms: 1200 }]
        },
        { phone: 'right' }
      ]
    },

    /* 07 ---------------------------------------------------------------- */
    {
      id: 's07', title: 'Files and version history', theme: 'light',
      headline: 'Every file. Every *version.*',
      points: ['One central file manager', 'Every change saved as a version', 'Compare, restore, and see who changed what'],
      bridge: 'Now that we know what changed, who is responsible for it?',
      steps: [
        { phone: 'right', scene: [{ swap: 'files.png' }, { clear: true }, { scroll: 0, ms: 600 }] },
        {
          phone: 'focus', scene: [
            { swap: 'files.png' }, { wait: 400 }, { tapAt: [70, 21] },
            { callout: 'All project files', at: [70, 21] }, { wait: 900 }, { clear: true },
            { swap: 'versions.png' }, { scroll: 38, ms: 1800 },
            { moveTo: [50, 55] }, { highlight: [4, 49, 92, 9] },
            { tap: true }, { callout: 'Restore any version', at: [50, 54] }, { pulse: [50, 54] }, { wait: 1000 },
            { clear: true }, { scroll: 0, ms: 1000 }]
        },
        { phone: 'right' }
      ]
    },

    /* 08 ---------------------------------------------------------------- */
    {
      id: 's08', title: 'Contribution and supervisor view', theme: 'light',
      headline: 'Fair evaluation, backed by *data.*',
      points: ['Individual analytics: tasks, files, activity', 'A fair view of every member', 'Project health summary for supervisors'],
      /* Counters use the sample project data visible in the screenshots. */
      counters: [
        { value: 18, decimals: 0, prefix: '', suffix: ' / 24', label: 'sprint tasks closed' },
        { value: 68, decimals: 0, prefix: '', suffix: '%', label: 'aggregate project health' },
        { value: 74, decimals: 0, prefix: '', suffix: '%', label: 'phase progress' }
      ],
      countersNote: 'Sample project data',
      bridge: 'Behind this clean experience is a carefully chosen architecture.',
      steps: [
        { phone: 'right', scene: [{ swap: 'analytics.png' }, { clear: true }, { scroll: 0, ms: 600 }] },
        {
          phone: 'right', scene: [
            { swap: 'analytics.png' }, { wait: 400 }, { zoom: [50, 22, 1.5], ms: 1500 },
            { highlight: [4, 17, 92, 18] }, { callout: 'Live project metrics', at: [50, 22] }, { wait: 1000 },
            { clear: true }, { unzoom: true, ms: 1100 }]
        },
        {
          phone: 'focus', scene: [
            { swap: 'supervisor.png' }, { wait: 500 }, { scroll: 18, ms: 1800 },
            { zoom: [50, 33, 1.4], ms: 1300 },
            { highlight: [4, 31, 92, 8] }, { callout: 'Teams that need attention', at: [50, 34] }, { wait: 1100 },
            { clear: true }, { unzoom: true, ms: 1000 }]
        },
        { phone: 'right' }
      ]
    },

    /* 09 ---------------------------------------------------------------- */
    {
      id: 's09', title: 'How it is built', theme: 'dark',
      headline: 'How it is *built.*',
      nodes: [
        { id: 'web', title: 'React frontend', sub: 'The web app' },
        { id: 'api', title: 'ASP.NET Core REST API', sub: 'Business rules + roles' },
        { id: 'db', title: 'Firebase / Firestore', sub: 'Data + real-time' }
      ],
      sidecars: ['Authentication', 'File storage'],
      flutterNote: 'The API endpoints are designed so a Flutter mobile app can reuse them.',
      comingLabel: 'Coming next: Flutter app',
      bridge: 'So where are we now, and where is TeamHub going next?',
      steps: [
        { phone: 'rightSmall', scene: [{ swap: 'dashboard.png' }, { clear: true }, { scroll: 0, ms: 600 }] },
        { phone: 'coming', scene: [{ swap: 'mobile.png' }, { scroll: 0, ms: 600 }, { wait: 600 }, { scroll: 40, ms: 2400 }] },
        { phone: 'rightSmall' }
      ]
    },

    /* 10 ---------------------------------------------------------------- */
    {
      id: 's10', title: 'Where we are and what is next', theme: 'light',
      headline: 'Where we are, and what is *next.*',
      status: 'Still under development',
      /* status: done | progress | next. Replace with real milestones. */
      milestones: [
        { label: 'MILESTONE_1', status: 'done' },
        { label: 'MILESTONE_2', status: 'done' },
        { label: 'MILESTONE_3', status: 'progress' },
        { label: 'MILESTONE_4', status: 'next' },
        { label: 'MILESTONE_5', status: 'next' }
      ],
      milestonesNote: 'PROGRESS PLACEHOLDERS',
      roadmap: ['Flutter mobile app', 'Notifications and reminders', 'AI smart summaries of project progress'],
      bridge: 'That is TeamHub. Back to where we started.',
      steps: [
        { phone: 'rightSmall', scene: [{ swap: 'dashboard.png' }, { clear: true }, { scroll: 0, ms: 600 }] },
        { phone: 'rightSmall' },
        { phone: 'hidden' }
      ]
    }
  ],

  /* ---------- Closing ---------- */
  coda: {
    thanks: 'Thank you',
    questions: 'Questions?'
  }
};
