import type {
  AdPlacement,
  ArticleStatus,
  ImportSourceType,
  PageStatus,
  SectionSourceType,
  SectionType,
} from "@prisma/client";

import { createRichContent } from "@/lib/content";
import { slugify } from "@/lib/utils";

export const demoRoles = [
  {
    name: "SUPER_ADMIN",
    label: "Super Admin",
    permissions: [
      "manage_articles",
      "publish_articles",
      "manage_taxonomy",
      "manage_media",
      "manage_pages",
      "manage_homepage",
      "manage_comments",
      "manage_subscribers",
      "manage_redirects",
      "manage_ads",
      "manage_settings",
      "manage_imports",
      "manage_users",
    ],
  },
  {
    name: "EDITOR",
    label: "Editor",
    permissions: [
      "manage_articles",
      "publish_articles",
      "manage_taxonomy",
      "manage_media",
      "manage_pages",
      "manage_homepage",
      "manage_comments",
      "manage_subscribers",
      "manage_redirects",
      "manage_ads",
    ],
  },
  {
    name: "AUTHOR",
    label: "Author",
    permissions: ["manage_articles", "manage_media"],
  },
  {
    name: "MODERATOR",
    label: "Moderator",
    permissions: ["manage_comments", "manage_subscribers"],
  },
] as const;

export const demoUsers = [
  {
    email: "editor@redwire.local",
    name: "Jordan Blake",
    roleName: "SUPER_ADMIN",
  },
  {
    email: "metro@redwire.local",
    name: "Maya Torres",
    roleName: "EDITOR",
  },
  {
    email: "sports@redwire.local",
    name: "Evan Carter",
    roleName: "AUTHOR",
  },
  {
    email: "moderator@redwire.local",
    name: "Avery Reed",
    roleName: "MODERATOR",
  },
] as const;

export const demoAuthors = [
  {
    displayName: "Jordan Blake",
    slug: "jordan-blake",
    title: "Editor in Chief",
    bio: "Jordan leads the Redwire Daily newsroom with a focus on accountability reporting, fast breaking coverage, and product innovation.",
    shortBio: "Leads Redwire Daily's editorial strategy and investigations desk.",
    twitterUrl: "https://twitter.com/redwiredaily",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    userEmail: "editor@redwire.local",
  },
  {
    displayName: "Maya Torres",
    slug: "maya-torres",
    title: "Metro Editor",
    bio: "Maya oversees metro coverage, transportation reporting, and public safety accountability stories across the region.",
    shortBio: "Metro editor covering transit, city hall, and public safety.",
    twitterUrl: "https://twitter.com/redwiredaily",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    userEmail: "metro@redwire.local",
  },
  {
    displayName: "Evan Carter",
    slug: "evan-carter",
    title: "Sports Reporter",
    bio: "Evan reports from stadiums, locker rooms, and practice facilities with a sharp eye for the business and emotion behind competition.",
    shortBio: "Sports reporter focused on pro and college teams.",
    twitterUrl: "https://twitter.com/redwiredaily",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    userEmail: "sports@redwire.local",
  },
  {
    displayName: "Naomi Pierce",
    slug: "naomi-pierce",
    title: "Investigations Reporter",
    bio: "Naomi combines data analysis, records requests, and field reporting to surface the stories institutions hope stay buried.",
    shortBio: "Investigative reporter focused on transparency and data.",
    twitterUrl: "https://twitter.com/redwiredaily",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80",
  },
  {
    displayName: "Marcus Hill",
    slug: "marcus-hill",
    title: "Business Reporter",
    bio: "Marcus covers development, labor, consumer finance, and the regional companies reshaping the economy.",
    shortBio: "Business reporter tracking growth, layoffs, and development.",
    twitterUrl: "https://twitter.com/redwiredaily",
    avatarUrl:
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=600&q=80",
  },
  {
    displayName: "Sofia Ramirez",
    slug: "sofia-ramirez",
    title: "Weather Anchor",
    bio: "Sofia turns complex forecasts into practical guidance for families, commuters, and emergency crews during severe weather events.",
    shortBio: "Weather specialist covering storms and climate impacts.",
    twitterUrl: "https://twitter.com/redwiredaily",
    avatarUrl:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80",
  },
] as const;

export const demoCategories = [
  {
    name: "Politics",
    slug: "politics",
    color: "#b30d16",
    label: "Politics",
    description: "Statehouse, elections, and policy coverage across the region.",
    subcategories: [
      { name: "Statehouse", slug: "statehouse" },
      { name: "Elections", slug: "elections" },
    ],
  },
  {
    name: "Metro",
    slug: "metro",
    color: "#111111",
    label: "Metro",
    description: "City hall, public safety, transit, and the stories shaping daily life.",
    subcategories: [
      { name: "Public Safety", slug: "public-safety" },
      { name: "Transit", slug: "transit" },
    ],
  },
  {
    name: "Investigations",
    slug: "investigations",
    color: "#6f1015",
    label: "Investigations",
    description: "Accountability reporting, data projects, and deep enterprise pieces.",
    subcategories: [
      { name: "Watchdog", slug: "watchdog" },
      { name: "Data Desk", slug: "data-desk" },
    ],
  },
  {
    name: "Business",
    slug: "business",
    color: "#b0430d",
    label: "Business",
    description: "Development, labor, real estate, consumer news, and markets.",
    subcategories: [
      { name: "Markets", slug: "markets" },
      { name: "Real Estate", slug: "real-estate" },
    ],
  },
  {
    name: "Sports",
    slug: "sports",
    color: "#96161c",
    label: "Sports",
    description: "Game coverage, analysis, and the business of sports.",
    subcategories: [
      { name: "Falcons", slug: "falcons" },
      { name: "Braves", slug: "braves" },
    ],
  },
  {
    name: "Weather",
    slug: "weather",
    color: "#2f2f2f",
    label: "Weather",
    description: "Storm tracking, climate, and everyday forecast coverage.",
    subcategories: [
      { name: "Forecast", slug: "forecast" },
      { name: "Storm Tracker", slug: "storm-tracker" },
    ],
  },
] as const;

export const demoTags = [
  "housing",
  "schools",
  "storm alert",
  "election 2026",
  "budget",
  "public safety",
  "development",
  "college sports",
  "consumer",
  "traffic",
  "accountability",
  "health",
  "us world",
  "good day",
  "seen on tv",
  "things to do",
  "money",
  "entertainment",
  "unusual",
].map((name) => ({
  name,
  slug: slugify(name),
}));

const storyBlueprints = [
  {
    title: "State budget negotiators close in on transit funding compromise after late-night talks",
    subtitle: "Leaders say a scaled package could protect rail repairs without delaying suburban road projects.",
    excerpt:
      "Capitol leaders say a revised transportation package is beginning to take shape after weeks of stalemate over rail maintenance, bus expansion, and highway borrowing.",
    categorySlug: "politics",
    subCategorySlug: "statehouse",
    authorSlug: "jordan-blake",
    tagSlugs: ["budget", "traffic", "public safety", "us world", "money"],
    featured: true,
    trending: true,
    breakingNews: true,
    popular: true,
    imageUrl:
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Mayor orders overtime audit after watchdog flags gaps in emergency response paperwork",
    subtitle: "The review follows months of internal warnings about staffing and shift reporting.",
    excerpt:
      "City hall has ordered an outside audit of emergency overtime spending after a review found inconsistent documentation and weak approval controls inside multiple departments.",
    categorySlug: "metro",
    subCategorySlug: "public-safety",
    authorSlug: "maya-torres",
    tagSlugs: ["public safety", "accountability"],
    breakingNews: true,
    trending: true,
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Court records show contractor tied to school repairs was paid before inspections were complete",
    subtitle: "Families were told classrooms would be ready weeks before engineers signed off on the work.",
    excerpt:
      "Invoices, inspection logs, and internal emails reviewed by Redwire Daily show a contractor received payment milestones before several required safety checks were finished.",
    categorySlug: "investigations",
    subCategorySlug: "watchdog",
    authorSlug: "naomi-pierce",
    tagSlugs: ["schools", "accountability", "health"],
    featured: true,
    popular: true,
    imageUrl:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Developers unveil mixed-use district planned around new riverfront trail extension",
    subtitle: "The proposal includes apartments, a food hall, and a transit hub built in phases.",
    excerpt:
      "A long-anticipated riverfront proposal would transform former warehouse blocks into a mixed-use district centered on housing, retail, and a rebuilt bus transfer station.",
    categorySlug: "business",
    subCategorySlug: "real-estate",
    authorSlug: "marcus-hill",
    tagSlugs: ["development", "housing", "traffic", "money"],
    featured: true,
    imageUrl:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Falcons reset red-zone package with rookie tight end emerging as focal point",
    subtitle: "Coaches say the offense is emphasizing tempo and shorter-yardage efficiency.",
    excerpt:
      "The Falcons spent the offseason rebuilding their short-yardage package, and early camp sessions suggest the rookie tight end class could change how the offense closes drives.",
    categorySlug: "sports",
    subCategorySlug: "falcons",
    authorSlug: "evan-carter",
    tagSlugs: ["college sports", "consumer", "good day", "seen on tv", "things to do", "entertainment"],
    trending: true,
    popular: true,
    videoEmbedUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
    imageUrl:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Storm threat ramps up Friday as heat, humidity, and hail risk align across the metro",
    subtitle: "Forecasters say the afternoon window could bring damaging wind and isolated flooding.",
    excerpt:
      "A volatile late-week pattern is raising the risk of severe weather, especially for commuters heading home during the peak evening window.",
    categorySlug: "weather",
    subCategorySlug: "storm-tracker",
    authorSlug: "sofia-ramirez",
    tagSlugs: ["storm alert", "traffic", "health", "seen on tv"],
    breakingNews: true,
    trending: true,
    popular: true,
    videoEmbedUrl: "https://www.youtube.com/embed/sCNrK-n68CM",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "County election offices prepare for surge in first-time mail ballot requests",
    subtitle: "Training sessions focus on signature review, ballot curing, and turnout bottlenecks.",
    excerpt:
      "Election officials say they are staffing up months earlier than usual as younger and more mobile voters increasingly choose to cast ballots by mail.",
    categorySlug: "politics",
    subCategorySlug: "elections",
    authorSlug: "jordan-blake",
    tagSlugs: ["election 2026", "budget", "us world"],
    imageUrl:
      "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Transit agency details overnight maintenance blitz meant to stabilize oldest rail corridor",
    subtitle: "Officials say riders will see slower weekend service but fewer emergency shutdowns.",
    excerpt:
      "Transit leaders are rolling out a six-week overnight maintenance blitz meant to reduce track failures and give crews extended access to the oldest parts of the system.",
    categorySlug: "metro",
    subCategorySlug: "transit",
    authorSlug: "maya-torres",
    tagSlugs: ["traffic", "budget", "money"],
    popular: true,
    imageUrl:
      "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "New records map how flood complaints clustered for years before drainage project was funded",
    subtitle: "Neighbors say the city only acted after repeated basement losses and insurance disputes.",
    excerpt:
      "A records review shows the city received hundreds of flood-related complaints over the last decade before finally advancing a drainage fix for one of the hardest-hit corridors.",
    categorySlug: "investigations",
    subCategorySlug: "data-desk",
    authorSlug: "naomi-pierce",
    tagSlugs: ["health", "accountability", "storm alert"],
    imageUrl:
      "https://images.unsplash.com/photo-1505678261036-a3fcc5e884ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Regional grocer freezes prices on staple items ahead of summer utility spike",
    subtitle: "Executives say the move is targeted at families already squeezed by insurance and rent.",
    excerpt:
      "One of the region's largest grocery chains says it will freeze prices on dozens of staple items as utility bills and housing costs continue to pressure household budgets.",
    categorySlug: "business",
    subCategorySlug: "markets",
    authorSlug: "marcus-hill",
    tagSlugs: ["consumer", "housing", "money", "good day"],
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Braves lean on bullpen depth as long road trip tests lineup consistency",
    subtitle: "The club says bullpen flexibility is helping bridge injuries and late-game matchups.",
    excerpt:
      "The Braves are leaning on a deeper-than-expected bullpen mix as a long road trip exposes both the strengths and volatility of the club's current lineup.",
    categorySlug: "sports",
    subCategorySlug: "braves",
    authorSlug: "evan-carter",
    tagSlugs: ["college sports", "things to do", "entertainment"],
    imageUrl:
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Weekend forecast keeps beaches breezy while inland communities face dangerous heat index",
    subtitle: "Meteorologists are watching whether a stalled boundary drifts back north Sunday.",
    excerpt:
      "A split weekend forecast will bring more comfortable coastal conditions while inland communities contend with heat index values that may approach advisory thresholds.",
    categorySlug: "weather",
    subCategorySlug: "forecast",
    authorSlug: "sofia-ramirez",
    tagSlugs: ["storm alert", "health", "good day", "things to do"],
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Lawmakers revive tax-credit debate as film and clean-energy lobbies crowd the Capitol",
    subtitle: "Supporters say the incentives are delivering jobs while critics want tighter reporting.",
    excerpt:
      "A renewed fight over tax incentives is pulling in some of the state's fastest-growing industries as lawmakers weigh job creation claims against rising budget pressure.",
    categorySlug: "politics",
    subCategorySlug: "statehouse",
    authorSlug: "jordan-blake",
    tagSlugs: ["budget", "development", "us world", "entertainment"],
    imageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Police staffing dashboard goes public with neighborhood-by-neighborhood vacancy data",
    subtitle: "City leaders say the new tool is meant to rebuild trust around deployment decisions.",
    excerpt:
      "A new public dashboard will let residents track officer vacancies, response time trends, and recruiting progress across police zones for the first time.",
    categorySlug: "metro",
    subCategorySlug: "public-safety",
    authorSlug: "maya-torres",
    tagSlugs: ["public safety", "accountability"],
    imageUrl:
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Procurement emails show repeated warnings before water billing rollout faltered",
    subtitle: "Internal messages reveal concerns about training gaps months before customers were overcharged.",
    excerpt:
      "Internal emails and vendor memos show city staff were warned repeatedly that a new water billing system was not ready for launch before widespread errors hit customers.",
    categorySlug: "investigations",
    subCategorySlug: "watchdog",
    authorSlug: "naomi-pierce",
    tagSlugs: ["consumer", "accountability"],
    imageUrl:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Office-to-residential conversions gain momentum as lenders soften on downtown projects",
    subtitle: "Developers say smaller floor plates and public incentives are finally making deals pencil.",
    excerpt:
      "Several long-stalled downtown buildings are back in play as lenders grow more comfortable with office-to-residential conversions and public incentives expand.",
    categorySlug: "business",
    subCategorySlug: "real-estate",
    authorSlug: "marcus-hill",
    tagSlugs: ["housing", "development", "money", "us world"],
    trending: true,
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "College kickoff economics: why small businesses circle opening weekend months in advance",
    subtitle: "Restaurants and hotels say the first home game often sets the tone for the entire fall.",
    excerpt:
      "From staffing plans to patio upgrades, small businesses near stadium districts say opening weekend can determine whether the rest of the season feels like growth or survival.",
    categorySlug: "sports",
    subCategorySlug: "falcons",
    authorSlug: "evan-carter",
    tagSlugs: ["college sports", "consumer", "development", "things to do", "good day", "money"],
    imageUrl:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Storm team tracks stubborn coastal low that could shift rain totals overnight",
    subtitle: "Forecasters say a small track change could sharply alter flooding potential by sunrise.",
    excerpt:
      "Meteorologists are watching a compact coastal low that could redirect the heaviest rain bands into metro neighborhoods before the morning commute.",
    categorySlug: "weather",
    subCategorySlug: "storm-tracker",
    authorSlug: "sofia-ramirez",
    tagSlugs: ["storm alert", "traffic", "seen on tv"],
    imageUrl:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Voters confront crowded district races where turnout, not television ads, may decide the winner",
    subtitle: "Campaigns are shifting money into field work as undecided voters remain unusually high.",
    excerpt:
      "With multiple competitive district races on the ballot, strategists in both parties say turnout operations may matter more than expensive media buys this cycle.",
    categorySlug: "politics",
    subCategorySlug: "elections",
    authorSlug: "jordan-blake",
    tagSlugs: ["election 2026", "schools", "us world"],
    imageUrl:
      "https://images.unsplash.com/photo-1555967522-37949fc21dcb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Bus corridor redesign promises shorter waits, but merchants worry about curb access",
    subtitle: "Transit planners say loading zones and side-street deliveries will be reworked block by block.",
    excerpt:
      "A high-frequency bus redesign could cut wait times across one of the busiest corridors, though merchants remain skeptical about how construction and curb changes will affect daily business.",
    categorySlug: "metro",
    subCategorySlug: "transit",
    authorSlug: "maya-torres",
    tagSlugs: ["traffic", "development", "consumer"],
    imageUrl:
      "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Data project reveals how emergency code violations spread through aging apartment stock",
    subtitle: "Inspectors say repeat ownership groups often move faster than enforcement timelines.",
    excerpt:
      "A Redwire Daily data analysis found recurring emergency violations clustered in aging apartment properties where residents reported repeat repairs, mold, and electrical hazards.",
    categorySlug: "investigations",
    subCategorySlug: "data-desk",
    authorSlug: "naomi-pierce",
    tagSlugs: ["housing", "health", "accountability"],
    popular: true,
    imageUrl:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Airport cargo expansion draws logistics firms, warehouse builders, and labor pressure",
    subtitle: "Industry groups say the next hiring wave will hinge on training pipelines and road access.",
    excerpt:
      "Cargo growth around the airport is attracting major logistics players, but developers and labor groups warn that road access and workforce training remain pinch points.",
    categorySlug: "business",
    subCategorySlug: "markets",
    authorSlug: "marcus-hill",
    tagSlugs: ["development", "traffic", "money", "us world"],
    imageUrl:
      "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Film room: why the defense is disguising pressure looks earlier this preseason",
    subtitle: "Assistant coaches say the new approach is about forcing faster reads before the snap.",
    excerpt:
      "Redwire's film breakdown shows why the defense is disguising its pressure looks earlier and how that wrinkle could change third-down efficiency this preseason.",
    categorySlug: "sports",
    subCategorySlug: "falcons",
    authorSlug: "evan-carter",
    tagSlugs: ["college sports", "seen on tv", "entertainment"],
    videoEmbedUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
    imageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Heat advisory expanded as overnight lows stay elevated for a third straight day",
    subtitle: "Emergency managers are extending cooling center hours and checking on vulnerable residents.",
    excerpt:
      "The heat advisory has expanded again as warm overnight temperatures continue to limit relief for residents without consistent cooling access.",
    categorySlug: "weather",
    subCategorySlug: "forecast",
    authorSlug: "sofia-ramirez",
    tagSlugs: ["health", "storm alert"],
    trending: true,
    imageUrl:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Teachers union and district reopen talks with calendar, class size, and safety still unresolved",
    subtitle: "Both sides say progress has been made, but the hardest issues remain on the table.",
    excerpt:
      "Negotiators returned to the table with cautious optimism, though class size caps, school safety staffing, and calendar changes remain major sticking points.",
    categorySlug: "politics",
    subCategorySlug: "statehouse",
    authorSlug: "jordan-blake",
    tagSlugs: ["schools", "budget", "us world"],
    imageUrl:
      "https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Neighborhood clinics brace for summer surge in respiratory complaints tied to air quality",
    subtitle: "Doctors say heat, ozone, and stubborn mold issues are colliding in vulnerable communities.",
    excerpt:
      "Clinics across the region say they are treating more respiratory complaints as poor air quality compounds underlying health concerns during the hottest stretch of the year.",
    categorySlug: "metro",
    subCategorySlug: "public-safety",
    authorSlug: "maya-torres",
    tagSlugs: ["health"],
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Utility debt dashboard reveals which neighborhoods carried the heaviest shutoff risk",
    subtitle: "Advocates say the data should inform grant programs before the next rate case hits.",
    excerpt:
      "A new utility debt dashboard gives an unprecedented look at where shutoff risk is accumulating and how arrears line up with income, age, and housing instability.",
    categorySlug: "investigations",
    subCategorySlug: "data-desk",
    authorSlug: "naomi-pierce",
    tagSlugs: ["housing", "consumer", "accountability", "money"],
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Home insurers test new products aimed at weather-proofing older Southern housing stock",
    subtitle: "Agents say premium relief is possible, but only when mitigation upgrades are documented well.",
    excerpt:
      "Insurers are experimenting with new products that reward storm mitigation and maintenance upgrades in older housing stock, though documentation still remains a hurdle for many homeowners.",
    categorySlug: "business",
    subCategorySlug: "real-estate",
    authorSlug: "marcus-hill",
    tagSlugs: ["housing", "storm alert", "consumer", "money"],
    imageUrl:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Ticket prices climb for rivalry weekend, but fan spending inside stadiums is flattening",
    subtitle: "Teams say premium seating is booming while concessions tell a more cautious story.",
    excerpt:
      "Average ticket prices are climbing into rivalry weekend, but stadium operators say spending on food, drinks, and merch is growing more uneven across fan segments.",
    categorySlug: "sports",
    subCategorySlug: "braves",
    authorSlug: "evan-carter",
    tagSlugs: ["consumer", "college sports", "things to do", "good day", "entertainment"],
    imageUrl:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Long-range outlook points to wetter pattern just as drought concerns eased in farm counties",
    subtitle: "Agriculture officials say the timing could help some crops while complicating harvest plans.",
    excerpt:
      "A shift toward a wetter long-range pattern could bring welcome relief to farm counties where drought stress was beginning to build earlier this month.",
    categorySlug: "weather",
    subCategorySlug: "forecast",
    authorSlug: "sofia-ramirez",
    tagSlugs: ["storm alert"],
    imageUrl:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Primary field expands again after former cabinet official jumps into open race",
    subtitle: "Strategists say the entrance could scramble fundraising and endorsements in both suburbs and exurbs.",
    excerpt:
      "The open race for statewide office grew more crowded again after a former cabinet official entered the primary, immediately shifting the fundraising and endorsement map.",
    categorySlug: "politics",
    subCategorySlug: "elections",
    authorSlug: "jordan-blake",
    tagSlugs: ["election 2026", "budget", "us world"],
    imageUrl:
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80",
  },
].map((story, index) => {
  const content = createRichContent({
    heading: `${story.title.split(" ").slice(0, 5).join(" ")}: what we're watching`,
    deck: story.subtitle,
    paragraphs: [
      `${story.excerpt} Editors say the next 48 hours will determine whether the story widens into a regional issue or stays confined to a handful of agencies and neighborhoods.`,
      "Sources familiar with the planning say officials have been balancing political pressure, operational limits, and a public demand for faster answers. The debate has turned especially sharp around the pace of implementation and who absorbs the cost.",
      "Community leaders told Redwire Daily they want clearer benchmarks, more public reporting, and fewer last-minute surprises. They say residents have learned to read small procedural changes as warning signs for bigger policy shifts.",
      "What happens next will likely depend on whether agencies can show early progress without creating new bottlenecks. Staff briefings are expected to continue through the week, with a formal update likely before the next public meeting.",
    ],
    bullets: [
      "Officials are under pressure to show measurable progress before the next public update.",
      "Residents are pushing for clearer benchmarks and more consistent communication.",
      "The financial impact could shape how quickly the proposal moves from planning to implementation.",
    ],
    quote:
      "People are less interested in slogans right now than they are in whether the fixes arrive on time and hold up under pressure.",
  });

  return {
    ...story,
    slug: slugify(story.title),
    seoTitle: `${story.title} | Redwire Daily`,
    metaDescription: story.excerpt,
    schemaType: "NewsArticle",
    status: "PUBLISHED" as ArticleStatus,
    publishAt: new Date(Date.now() - index * 1000 * 60 * 57),
    readTime: content.readTime,
    contentJson: content.json,
    contentHtml: content.html,
    contentText: content.text,
  };
});

export const demoArticles = storyBlueprints;

export const demoPages = [
  {
    title: "About Redwire Daily",
    slug: "about",
    summary: "Learn about our editorial standards, mission, and newsroom approach.",
    status: "PUBLISHED" as PageStatus,
    showInHeader: true,
    showInFooter: true,
  },
  {
    title: "Contact",
    slug: "contact",
    summary: "Reach our newsroom, tips desk, and advertising team.",
    status: "PUBLISHED" as PageStatus,
    showInHeader: true,
    showInFooter: true,
  },
  {
    title: "Privacy Policy",
    slug: "privacy-policy",
    summary: "How Redwire Daily collects, stores, and protects user information.",
    status: "PUBLISHED" as PageStatus,
    showInFooter: true,
  },
  {
    title: "Terms of Use",
    slug: "terms",
    summary: "Rules governing access to Redwire Daily products and services.",
    status: "PUBLISHED" as PageStatus,
    showInFooter: true,
  },
  {
    title: "Disclaimer",
    slug: "disclaimer",
    summary: "Editorial disclaimers, attribution practices, and liability boundaries.",
    status: "PUBLISHED" as PageStatus,
    showInFooter: true,
  },
  {
    title: "Advertise With Us",
    slug: "advertise",
    summary: "Audience, placements, sponsorship opportunities, and ad specs.",
    status: "PUBLISHED" as PageStatus,
    showInFooter: true,
  },
].map((page) => {
  const content = createRichContent({
    heading: page.title,
    paragraphs: [
      `${page.summary} This page is managed through the CMS so editors can keep it current without touching code.`,
      "Redwire Daily was designed to support a modern newsroom where editors, producers, and reporters work from a single publishing workflow with strong metadata, structured sections, and migration-ready content models.",
      "For public-facing trust, we keep newsroom standards visible and we treat clarity, correction workflows, and contact information as core product features rather than legal afterthoughts.",
    ],
    bullets:
      page.slug === "advertise"
        ? [
            "Homepage takeovers, sticky rail units, in-article placements, and sponsored blocks are supported.",
            "Creative can run through direct HTML tags today and move to ad server integrations later.",
          ]
        : undefined,
  });

  return {
    ...page,
    contentJson: content.json,
    contentHtml: content.html,
    seoTitle: `${page.title} | Redwire Daily`,
    metaDescription: page.summary,
  };
});

export const demoAdSlots: Array<{
  key: string;
  name: string;
  placement: AdPlacement;
  description: string;
  sponsorLabel?: string;
  advertiserName?: string;
  ctaLabel?: string;
  codeHtml?: string;
  imageUrl?: string;
  targetUrl?: string;
  positionKey?: string;
  injectAfterParagraph?: number;
  displayOrder?: number;
}> = [
  {
    key: "header-leaderboard",
    name: "Header Leaderboard",
    placement: "HEADER",
    description: "High-visibility top-of-page placement for premium campaigns.",
    sponsorLabel: "Sponsored",
    positionKey: "site-header",
    displayOrder: 1,
  },
  {
    key: "sidebar-rectangle",
    name: "Sidebar Rectangle",
    placement: "SIDEBAR",
    description: "Right rail inventory for desktop article pages and category pages.",
    sponsorLabel: "Partner Message",
    positionKey: "article-sidebar",
    displayOrder: 1,
  },
  {
    key: "in-article-inline-a",
    name: "In Article Inline A",
    placement: "IN_ARTICLE",
    description: "Inline advertiser slot inserted early in long-form stories.",
    sponsorLabel: "Sponsored",
    positionKey: "article-body",
    injectAfterParagraph: 2,
    displayOrder: 1,
  },
  {
    key: "in-article-inline-b",
    name: "In Article Inline B",
    placement: "IN_ARTICLE",
    description: "Second in-story advertiser slot for deeper reads.",
    sponsorLabel: "Sponsored",
    positionKey: "article-body",
    injectAfterParagraph: 5,
    displayOrder: 2,
  },
  {
    key: "footer-banner",
    name: "Footer Banner",
    placement: "FOOTER",
    description: "Footer inventory for brand campaigns and newsletter promos.",
    sponsorLabel: "Sponsored",
    positionKey: "site-footer",
    displayOrder: 1,
  },
  {
    key: "homepage-sponsored",
    name: "Homepage Sponsored Block",
    placement: "HOMEPAGE",
    description: "Sponsored homepage unit that can be controlled through homepage sections.",
    sponsorLabel: "Sponsor Content",
    positionKey: "homepage-sponsored",
    displayOrder: 1,
  },
];

export const demoHomepageSections: Array<{
  key: string;
  type: SectionType;
  title: string;
  description?: string;
  enabled: boolean;
  sortOrder: number;
  sourceType: SectionSourceType;
  limit: number;
  categorySlug?: string;
  tagSlug?: string;
  adSlotKey?: string;
  manualArticleSlugs?: string[];
  settings?: {
    eyebrow?: string;
    layout?: "cards" | "dense" | "split" | "compact" | "utility" | "weather";
    viewAllHref?: string;
    viewAllLabel?: string;
    promoText?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
}> = [
  {
    key: "home-live-now",
    type: "EDITOR_PICKS",
    title: "Watch Live",
    description: "Fast, live, and anchored around the biggest stories moving now.",
    enabled: true,
    sortOrder: 1,
    sourceType: "MANUAL",
    limit: 3,
    manualArticleSlugs: demoArticles.slice(0, 3).map((story) => story.slug),
    settings: {
      eyebrow: "Live",
      layout: "utility",
      viewAllHref: "/videos",
      viewAllLabel: "Latest video",
      promoText:
        "Live streams, urgent updates, and fast explainer coverage from the newsroom as stories move.",
      ctaLabel: "Watch live",
      ctaHref: "/videos",
    },
  },
  {
    key: "home-weather-center",
    type: "EDITOR_PICKS",
    title: "Weather Center",
    description: "Forecast context, storm tracking, and commute-ready updates.",
    enabled: true,
    sortOrder: 2,
    sourceType: "CATEGORY",
    categorySlug: "weather",
    limit: 3,
    settings: {
      eyebrow: "Forecast",
      layout: "weather",
      viewAllHref: "/category/weather",
      viewAllLabel: "Weather desk",
      promoText:
        "Storm timing, live forecast updates, and sharp weather context built for commuters and families.",
      ctaLabel: "Track weather",
      ctaHref: "/category/weather",
    },
  },
  {
    key: "home-hero",
    type: "HERO",
    title: "Top Stories",
    enabled: true,
    sortOrder: 3,
    sourceType: "FEATURED",
    limit: 4,
    settings: {
      eyebrow: "Top Stories",
      layout: "split",
    },
  },
  {
    key: "home-breaking",
    type: "BREAKING_STRIP",
    title: "Breaking",
    enabled: true,
    sortOrder: 4,
    sourceType: "BREAKING",
    limit: 5,
  },
  {
    key: "home-latest-videos",
    type: "VIDEO_HIGHLIGHTS",
    title: "Latest Videos",
    description: "Fresh clips, field hits, and fast-twitch coverage from across the newsroom.",
    enabled: true,
    sortOrder: 5,
    sourceType: "VIDEO",
    limit: 4,
    settings: {
      eyebrow: "Video",
      layout: "compact",
      viewAllHref: "/videos",
      viewAllLabel: "Watch more",
    },
  },
  {
    key: "home-newsletter",
    type: "NEWSLETTER_CTA",
    title: "The Morning Brief",
    description: "A concise local and national briefing sent before the day starts.",
    enabled: true,
    sortOrder: 6,
    sourceType: "MANUAL",
    limit: 1,
    settings: {
      eyebrow: "Newsletter",
      promoText: "All the news you need to know before work, school, or the first coffee refill.",
    },
  },
  {
    key: "home-local-news",
    type: "CATEGORY_BLOCK",
    title: "Local News",
    enabled: true,
    sortOrder: 7,
    sourceType: "CATEGORY",
    categorySlug: "metro",
    limit: 4,
    settings: {
      eyebrow: "Local",
      layout: "dense",
      viewAllHref: "/category/metro",
      viewAllLabel: "View more",
    },
  },
  {
    key: "home-us-world",
    type: "EDITOR_PICKS",
    title: "U.S. & World",
    enabled: true,
    sortOrder: 8,
    sourceType: "TAG",
    tagSlug: "us world",
    limit: 5,
    settings: {
      eyebrow: "National",
      layout: "dense",
      viewAllHref: "/tag/us-world",
      viewAllLabel: "U.S. & world",
    },
  },
  {
    key: "home-consumer",
    type: "EDITOR_PICKS",
    title: "Consumer",
    enabled: true,
    sortOrder: 9,
    sourceType: "TAG",
    tagSlug: "consumer",
    limit: 4,
    settings: {
      eyebrow: "Consumer",
      layout: "dense",
      viewAllHref: "/tag/consumer",
      viewAllLabel: "More consumer",
    },
  },
  {
    key: "home-good-day",
    type: "EDITOR_PICKS",
    title: "Good Day Atlanta",
    enabled: true,
    sortOrder: 10,
    sourceType: "TAG",
    tagSlug: "good day",
    limit: 4,
    settings: {
      eyebrow: "Shows",
      layout: "dense",
      viewAllHref: "/tag/good-day",
      viewAllLabel: "Good Day stories",
      promoText: "A lighter, personality-led mix of culture, community, and conversation starters.",
    },
  },
  {
    key: "home-seen-on-tv",
    type: "EDITOR_PICKS",
    title: "Seen on TV",
    enabled: true,
    sortOrder: 11,
    sourceType: "TAG",
    tagSlug: "seen on tv",
    limit: 3,
    settings: {
      eyebrow: "Seen on TV",
      layout: "compact",
      viewAllHref: "/tag/seen-on-tv",
      viewAllLabel: "More segments",
      promoText: "Featured segments, explainers, and clips pulled from on-air coverage.",
    },
  },
  {
    key: "home-things-to-do",
    type: "EDITOR_PICKS",
    title: "Things To Do",
    enabled: true,
    sortOrder: 12,
    sourceType: "TAG",
    tagSlug: "things to do",
    limit: 4,
    settings: {
      eyebrow: "Guide",
      layout: "compact",
      viewAllHref: "/tag/things-to-do",
      viewAllLabel: "Weekend guide",
      promoText: "Events, local hangs, and the stories worth planning around this week.",
    },
  },
  {
    key: "home-sports",
    type: "CATEGORY_BLOCK",
    title: "Sports",
    enabled: true,
    sortOrder: 13,
    sourceType: "CATEGORY",
    categorySlug: "sports",
    limit: 4,
    settings: {
      eyebrow: "Sports",
      layout: "dense",
      viewAllHref: "/category/sports",
      viewAllLabel: "More sports",
    },
  },
  {
    key: "home-money",
    type: "EDITOR_PICKS",
    title: "Money",
    enabled: true,
    sortOrder: 14,
    sourceType: "TAG",
    tagSlug: "money",
    limit: 4,
    settings: {
      eyebrow: "Money",
      layout: "dense",
      viewAllHref: "/tag/money",
      viewAllLabel: "Money desk",
    },
  },
  {
    key: "home-politics",
    type: "CATEGORY_BLOCK",
    title: "Politics",
    enabled: true,
    sortOrder: 15,
    sourceType: "CATEGORY",
    categorySlug: "politics",
    limit: 4,
    settings: {
      eyebrow: "Politics",
      layout: "dense",
      viewAllHref: "/category/politics",
      viewAllLabel: "Politics desk",
    },
  },
  {
    key: "home-health",
    type: "EDITOR_PICKS",
    title: "Health",
    enabled: true,
    sortOrder: 16,
    sourceType: "TAG",
    tagSlug: "health",
    limit: 4,
    settings: {
      eyebrow: "Health",
      layout: "dense",
      viewAllHref: "/tag/health",
      viewAllLabel: "Health topics",
    },
  },
  {
    key: "home-entertainment",
    type: "EDITOR_PICKS",
    title: "Entertainment",
    enabled: true,
    sortOrder: 17,
    sourceType: "TAG",
    tagSlug: "entertainment",
    limit: 4,
    settings: {
      eyebrow: "Entertainment",
      layout: "compact",
      viewAllHref: "/tag/entertainment",
      viewAllLabel: "More entertainment",
    },
  },
  {
    key: "home-video",
    type: "VIDEO_HIGHLIGHTS",
    title: "Video",
    enabled: true,
    sortOrder: 18,
    sourceType: "VIDEO",
    limit: 6,
    settings: {
      eyebrow: "Video",
      layout: "compact",
      viewAllHref: "/videos",
      viewAllLabel: "See all video",
    },
  },
  {
    key: "home-unusual",
    type: "EDITOR_PICKS",
    title: "Unusual",
    enabled: true,
    sortOrder: 19,
    sourceType: "MANUAL",
    limit: 4,
    manualArticleSlugs: demoArticles.slice(20, 24).map((story) => story.slug),
    settings: {
      eyebrow: "Unusual",
      layout: "dense",
      promoText: "Unexpected turns, lighter stories, and the newsroom’s curious edge cases.",
    },
  },
  {
    key: "home-investigations",
    type: "CATEGORY_BLOCK",
    title: "Investigations",
    enabled: true,
    sortOrder: 20,
    sourceType: "CATEGORY",
    categorySlug: "investigations",
    limit: 4,
    settings: {
      eyebrow: "Investigations",
      layout: "dense",
      viewAllHref: "/category/investigations",
      viewAllLabel: "Deep dives",
    },
  },
  {
    key: "home-sponsored",
    type: "SPONSORED_BLOCK",
    title: "Sponsored",
    enabled: true,
    sortOrder: 21,
    sourceType: "MANUAL",
    adSlotKey: "homepage-sponsored",
    limit: 1,
    settings: {
      eyebrow: "Sponsor Content",
      viewAllLabel: "Partner site",
    },
  },
  {
    key: "home-most-read",
    type: "MOST_READ",
    title: "Most Read",
    enabled: true,
    sortOrder: 22,
    sourceType: "MOST_READ",
    limit: 5,
    settings: {
      eyebrow: "Most Read",
      layout: "dense",
    },
  },
];

export const demoRedirects = [
  {
    sourcePath: "/2024/metro/old-city-hall-proposal",
    destinationPath: "/article/state-budget-negotiators-close-in-on-transit-funding-compromise-after-late-night-talks",
    statusCode: 301,
    notes: "Legacy WordPress path migrated to new canonical article URL.",
  },
  {
    sourcePath: "/category/politics-news",
    destinationPath: "/category/politics",
    statusCode: 301,
    notes: "Normalized category slug during migration planning.",
  },
  {
    sourcePath: "/advertising",
    destinationPath: "/advertise",
    statusCode: 302,
    notes: "Legacy marketing URL temporarily pointed at CMS page.",
  },
];

export const demoSettings = [
  {
    key: "site.identity",
    group: "general",
    label: "Site Identity",
    description: "Core brand and organization metadata used across SEO and footer modules.",
    value: {
      siteName: "Redwire Daily",
      tagline: "Fast reporting. Clean signal. Strong accountability.",
      organizationName: "Redwire Daily Media Group",
      logoUrl: "/logo.svg",
    },
  },
  {
    key: "site.contact",
    group: "general",
    label: "Contact Details",
    description: "Public contact information rendered in footer and contact page.",
    value: {
      newsroomEmail: "news@newschannel3now.com",
      tipsEmail: "news@newschannel3now.com",
      phone: "(404) 555-0184",
      address: "120 Peachtree Center Ave, Atlanta, GA 30303",
    },
  },
  {
    key: "site.social",
    group: "general",
    label: "Social Accounts",
    description: "Social links used in metadata and footer modules.",
    value: {
      x: "https://twitter.com/redwiredaily",
      facebook: "https://facebook.com/redwiredaily",
      youtube: "https://youtube.com/@redwiredaily",
      instagram: "https://instagram.com/redwiredaily",
    },
  },
  {
    key: "site.newsletter",
    group: "marketing",
    label: "Newsletter CTA",
    description: "Homepage and article-page newsletter copy.",
    value: {
      headline: "Get the 7AM Briefing",
      description: "Top stories, weather, and what matters before your first meeting.",
    },
  },
];

export const demoSubscribers = [
  { email: "alex@example.com", firstName: "Alex" },
  { email: "taylor@example.com", firstName: "Taylor" },
  { email: "riley@example.com", firstName: "Riley" },
  { email: "jamie@example.com", firstName: "Jamie" },
];

export const demoComments = [
  {
    articleSlug: demoArticles[0].slug,
    authorName: "Chris M.",
    authorEmail: "chris@example.com",
    content: "Transit reliability has been slipping for months. If the compromise protects repairs, commuters will feel it quickly.",
    status: "APPROVED",
  },
  {
    articleSlug: demoArticles[2].slug,
    authorName: "Lena P.",
    authorEmail: "lena@example.com",
    content: "This is exactly the kind of records-based reporting local news should keep investing in.",
    status: "APPROVED",
  },
  {
    articleSlug: demoArticles[5].slug,
    authorName: "Marvin R.",
    authorEmail: "marvin@example.com",
    content: "Please keep the forecast videos easy to find on mobile. They help during severe weather.",
    status: "PENDING",
  },
  {
    articleSlug: demoArticles[15].slug,
    authorName: "Dana S.",
    authorEmail: "dana@example.com",
    content: "Downtown conversions make sense, but the affordability numbers need to be public from day one.",
    status: "APPROVED",
  },
];

export const demoImportBatch = {
  title: "WordPress migration dry run",
  sourceType: "WORDPRESS_XML" as ImportSourceType,
  status: "DRY_RUN",
  dryRun: true,
  fileName: "legacy-wordpress-export.xml",
  stats: {
    postsDetected: 186,
    pagesDetected: 24,
    mediaDetected: 312,
    duplicatesFlagged: 8,
  },
};
