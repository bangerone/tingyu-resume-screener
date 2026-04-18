// ============================================================
// 学校档次字典 —— C9 / 985 / 211 / 双一流 / QS50 / QS100
// ------------------------------------------------------------
// HR 只要在 criteria.schoolTiers 里列出要求的档次，系统自动拿
// 候选人 education[].school 去匹配，无需 LLM 自己猜名单。
//
// 985 / 211 / 双一流：国务院教育部官方名单（双一流为 2022 第二轮）。
// QS50 / QS100：QS World University Rankings 2026（2025-06 发布）。
//
// 匹配策略：双向 normalize 后 includes 判定 —— 容忍全称/简称/中英混写。
// ============================================================

export type SchoolTier = "c9" | "985" | "211" | "shuangyiliu" | "qs50" | "qs100";

export const SCHOOL_TIER_LABELS: Record<SchoolTier, string> = {
  c9: "C9",
  "985": "985",
  "211": "211",
  shuangyiliu: "双一流",
  qs50: "QS 前 50",
  qs100: "QS 前 100",
};

/** 用于 matching 的 normalize：去标点、去空格、去括号内容、小写化、
 *  再把「大学/学院/University/College/of/the」等通用词删掉。 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, "") // 去除括号内容
    .replace(/[\s,.'·&-]/g, "")
    .replace(
      /(university|universite|universität|universitat|universidad|college|institute|ofscience|oftechnology|technology|ofand|of|the|大学|学院|学校)/g,
      "",
    );
}

/** 每所学校存若干别名（中/英/缩写/简称），匹配时取任一命中即可。 */
// ---- C9 联盟（9 所）----
const C9 = [
  ["清华大学", "清华", "Tsinghua", "THU"],
  ["北京大学", "北大", "Peking", "PKU"],
  ["复旦大学", "复旦", "Fudan"],
  ["上海交通大学", "上海交大", "上交", "SJTU", "Shanghai Jiao Tong"],
  ["浙江大学", "浙大", "Zhejiang", "ZJU"],
  ["南京大学", "南大", "Nanjing", "NJU"],
  ["中国科学技术大学", "中科大", "科大", "USTC"],
  ["哈尔滨工业大学", "哈工大", "HIT", "Harbin Institute"],
  ["西安交通大学", "西安交大", "西交", "XJTU", "Xi'an Jiaotong"],
];

// ---- 985（39 所）= C9 + 额外 30 所 ----
const ADDITIONAL_985 = [
  ["北京航空航天大学", "北航", "BUAA", "Beihang"],
  ["北京理工大学", "北理工", "BIT"],
  ["中国人民大学", "人大", "人民大学", "Renmin"],
  ["中央民族大学", "民族大学", "Minzu"],
  ["中国农业大学", "中国农大", "CAU"],
  ["北京师范大学", "北师大", "BNU", "Beijing Normal"],
  ["天津大学", "天大", "Tianjin"],
  ["南开大学", "南开", "Nankai"],
  ["大连理工大学", "大工", "DUT", "Dalian"],
  ["吉林大学", "吉大", "Jilin"],
  ["东北大学", "东大", "Northeastern"],
  ["同济大学", "同济", "Tongji"],
  ["华东师范大学", "华东师大", "ECNU"],
  ["武汉大学", "武大", "Wuhan", "WHU"],
  ["华中科技大学", "华科", "HUST"],
  ["中山大学", "中大", "Sun Yat-sen", "SYSU"],
  ["华南理工大学", "华工", "SCUT"],
  ["湖南大学", "湖大", "Hunan"],
  ["中南大学", "中南", "Central South", "CSU"],
  ["国防科技大学", "国防科大", "NUDT"],
  ["厦门大学", "厦大", "Xiamen", "XMU"],
  ["山东大学", "山大", "Shandong"],
  ["中国海洋大学", "海大", "Ocean University"],
  ["四川大学", "川大", "Sichuan"],
  ["电子科技大学", "电子科大", "UESTC"],
  ["重庆大学", "重大", "Chongqing"],
  ["西北工业大学", "西工大", "NPU"],
  ["西北农林科技大学", "西北农林"],
  ["兰州大学", "兰大", "Lanzhou"],
  ["东南大学", "东南", "Southeast University"],
];

// ---- 211（~116 所）= 985 + 额外 77 所 ----
const ADDITIONAL_211 = [
  ["北京交通大学"], ["北京工业大学"], ["北京科技大学"], ["北京化工大学"],
  ["北京邮电大学"], ["北京林业大学"], ["北京中医药大学"], ["中国传媒大学"],
  ["对外经济贸易大学"], ["中央财经大学"], ["北京外国语大学"], ["中国政法大学"],
  ["中央音乐学院"], ["华北电力大学"], ["中国矿业大学"], ["中国石油大学"],
  ["中国地质大学"], ["天津医科大学"], ["河北工业大学"], ["太原理工大学"],
  ["内蒙古大学"], ["辽宁大学"], ["大连海事大学"], ["延边大学"],
  ["东北师范大学"], ["东北农业大学"], ["东北林业大学"], ["哈尔滨工程大学"],
  ["华东理工大学"], ["东华大学"], ["上海财经大学"], ["上海大学"],
  ["上海外国语大学"], ["河海大学"], ["江南大学"], ["南京理工大学"],
  ["南京航空航天大学", "南航"], ["中国药科大学"], ["南京农业大学"],
  ["南京师范大学"], ["苏州大学"], ["中国矿业大学"], ["安徽大学"],
  ["合肥工业大学"], ["福州大学"], ["南昌大学"], ["郑州大学"],
  ["中国地质大学"], ["华中农业大学"], ["华中师范大学"], ["中南财经政法大学"],
  ["武汉理工大学"], ["湖南师范大学"], ["暨南大学"], ["华南师范大学"],
  ["海南大学"], ["广西大学"], ["西南大学"], ["西南交通大学"],
  ["西南财经大学"], ["西南政法大学"], ["四川农业大学"], ["贵州大学"],
  ["云南大学"], ["西藏大学"], ["西北大学"], ["长安大学"],
  ["陕西师范大学"], ["第四军医大学"], ["新疆大学"], ["石河子大学"],
  ["青海大学"], ["宁夏大学"], ["华中师范大学"], ["华东理工大学"],
  ["第二军医大学"], ["第三军医大学"],
];

// ---- 双一流额外（仅 2022 第二轮新增，约 25 所不在 211 中）----
const ADDITIONAL_SHUANGYILIU = [
  ["宁波大学"], ["河南大学"], ["湘潭大学"], ["山西大学"],
  ["南京邮电大学"], ["南京林业大学"], ["南京信息工程大学"],
  ["南京医科大学"], ["上海中医药大学"], ["上海科技大学"],
  ["天津工业大学"], ["天津中医药大学"], ["华南农业大学"],
  ["广州中医药大学"], ["广州医科大学"], ["北京协和医学院", "协和医学院"],
  ["首都师范大学"], ["中央美术学院"], ["中央戏剧学院"],
  ["中国美术学院"], ["中国音乐学院"], ["外交学院"],
  ["国际关系学院"], ["中国人民公安大学"], ["中国科学院大学", "国科大"],
  ["成都理工大学"], ["成都中医药大学"], ["北京体育大学"],
];

// ---- QS 2026 Top 50 ----
const QS50 = [
  ["Massachusetts Institute of Technology", "MIT", "麻省理工"],
  ["Imperial College London", "Imperial College", "帝国理工"],
  ["Stanford University", "Stanford", "斯坦福"],
  ["University of Oxford", "Oxford", "牛津"],
  ["Harvard University", "Harvard", "哈佛"],
  ["University of Cambridge", "Cambridge", "剑桥"],
  ["ETH Zurich", "ETH Zürich", "Eidgenössische Technische Hochschule", "苏黎世联邦理工"],
  ["National University of Singapore", "NUS", "新加坡国立"],
  ["UCL", "University College London", "伦敦大学学院"],
  ["California Institute of Technology", "Caltech", "加州理工"],
  ["The University of Hong Kong", "HKU", "香港大学", "港大"],
  ["Nanyang Technological University", "NTU Singapore", "南洋理工"],
  ["University of Chicago", "UChicago", "芝加哥大学"],
  ["Peking University", "北京大学", "北大", "PKU"],
  ["University of Pennsylvania", "UPenn", "Penn", "宾夕法尼亚大学"],
  ["Cornell University", "Cornell", "康奈尔"],
  ["Tsinghua University", "清华大学", "清华", "THU"],
  ["University of California, Berkeley", "UC Berkeley", "Berkeley", "伯克利", "UCB"],
  ["The University of Melbourne", "Melbourne", "墨尔本大学"],
  ["The University of New South Wales", "UNSW", "新南威尔士大学"],
  ["Yale University", "Yale", "耶鲁"],
  ["École Polytechnique Fédérale de Lausanne", "EPFL", "洛桑联邦理工"],
  ["Technical University of Munich", "TUM", "慕尼黑工业大学"],
  ["Johns Hopkins University", "Johns Hopkins", "约翰斯霍普金斯"],
  ["Princeton University", "Princeton", "普林斯顿"],
  ["The University of Sydney", "Sydney", "悉尼大学"],
  ["McGill University", "McGill", "麦吉尔"],
  ["PSL University", "Paris Sciences et Lettres", "巴黎文理研究大学"],
  ["University of Toronto", "UofT", "多伦多大学"],
  ["Fudan University", "复旦大学", "复旦", "Fudan"],
  ["King's College London", "KCL", "伦敦国王学院"],
  ["Australian National University", "ANU", "澳国立"],
  ["The Chinese University of Hong Kong", "CUHK", "香港中文大学", "港中文"],
  ["University of Edinburgh", "Edinburgh", "爱丁堡大学"],
  ["The University of Manchester", "Manchester", "曼彻斯特大学"],
  ["Monash University", "Monash", "莫纳什"],
  ["The University of Tokyo", "Tokyo University", "东京大学", "东大"],
  ["Columbia University", "Columbia", "哥伦比亚大学"],
  ["Seoul National University", "SNU", "首尔国立大学"],
  ["University of British Columbia", "UBC", "英属哥伦比亚大学"],
  ["Institut Polytechnique de Paris", "IP Paris", "巴黎综合理工"],
  ["Northwestern University", "Northwestern", "西北大学 US", "Northwestern US"],
  ["The University of Queensland", "UQ", "昆士兰大学"],
  ["The Hong Kong University of Science and Technology", "HKUST", "香港科技大学", "港科大"],
  ["University of Michigan", "UMich", "Michigan Ann Arbor", "密歇根大学"],
  ["University of California, Los Angeles", "UCLA", "加州大学洛杉矶"],
  ["Delft University of Technology", "TU Delft", "代尔夫特理工"],
  ["Shanghai Jiao Tong University", "上海交通大学", "上海交大", "SJTU"],
  ["Zhejiang University", "浙江大学", "浙大", "ZJU"],
  ["Yonsei University", "Yonsei", "延世大学"],
];

// ---- QS 2026 Top 51-100 ----
const QS_51_100 = [
  ["University of Bristol", "Bristol", "布里斯托大学"],
  ["Carnegie Mellon University", "CMU", "卡内基梅隆"],
  ["University of Amsterdam", "UvA", "阿姆斯特丹大学"],
  ["Hong Kong Polytechnic University", "PolyU", "香港理工"],
  ["New York University", "NYU", "纽约大学"],
  ["London School of Economics", "LSE", "伦敦政经"],
  ["Kyoto University", "京都大学"],
  ["Ludwig-Maximilians-Universität München", "LMU Munich", "慕尼黑大学"],
  ["University of Malaya", "UM", "马来亚大学"],
  ["KU Leuven", "鲁汶大学"],
  ["Korea University", "高丽大学"],
  ["Duke University", "Duke", "杜克"],
  ["City University of Hong Kong", "CityU HK", "香港城市大学", "港城大"],
  ["National Taiwan University", "NTU Taiwan", "台湾大学", "台大"],
  ["University of Auckland", "奥克兰大学"],
  ["University of California San Diego", "UCSD", "加州大学圣地亚哥"],
  ["King Fahd University of Petroleum and Minerals", "KFUPM"],
  ["University of Texas at Austin", "UT Austin", "德州大学奥斯汀"],
  ["Brown University", "Brown", "布朗大学"],
  ["University of Illinois Urbana-Champaign", "UIUC", "伊利诺伊香槟"],
  ["Université Paris-Saclay", "巴黎萨克雷大学"],
  ["Lund University", "隆德大学"],
  ["Sorbonne Université", "Sorbonne", "索邦大学"],
  ["University of Warwick", "Warwick", "华威大学"],
  ["Trinity College Dublin", "都柏林圣三一"],
  ["University of Birmingham", "Birmingham", "伯明翰大学"],
  ["The University of Western Australia", "UWA", "西澳大学"],
  ["KTH Royal Institute of Technology", "KTH", "皇家理工 瑞典"],
  ["University of Glasgow", "Glasgow", "格拉斯哥大学"],
  ["Universität Heidelberg", "海德堡大学"],
  ["University of Washington", "UW", "华盛顿大学"],
  ["Adelaide University", "阿德莱德大学"],
  ["Pennsylvania State University", "Penn State", "宾州州立"],
  ["Universidad de Buenos Aires", "UBA", "布宜诺斯艾利斯大学"],
  ["Tokyo Institute of Technology", "Tokyo Tech", "东京工业大学"],
  ["University of Leeds", "Leeds", "利兹大学"],
  ["University of Southampton", "Southampton", "南安普顿大学"],
  ["Boston University", "BU", "波士顿大学"],
  ["Freie Universität Berlin", "柏林自由大学"],
  ["Purdue University West Lafayette", "Purdue", "普渡大学"],
  ["The University of Osaka", "Osaka University", "大阪大学"],
  ["University of Sheffield", "Sheffield", "谢菲尔德大学"],
  ["Uppsala University", "乌普萨拉大学"],
  ["Durham University", "Durham", "杜伦大学"],
  ["University of Alberta", "阿尔伯塔大学"],
  ["University of Technology Sydney", "UTS", "悉尼科技大学"],
  ["University of Nottingham", "Nottingham", "诺丁汉大学"],
  ["Karlsruhe Institute of Technology", "KIT", "卡尔斯鲁厄理工"],
  ["Politecnico di Milano", "米兰理工"],
  ["University of Zurich", "苏黎世大学"],
];

// ---- 聚合 + normalize ----

function toNormalizedSet(schools: string[][]): Set<string> {
  const s = new Set<string>();
  for (const aliases of schools) {
    for (const a of aliases) {
      const n = normalize(a);
      if (n.length >= 2) s.add(n);
    }
  }
  return s;
}

const C9_SET = toNormalizedSet(C9);
const SET_985 = toNormalizedSet([...C9, ...ADDITIONAL_985]);
const SET_211 = toNormalizedSet([...C9, ...ADDITIONAL_985, ...ADDITIONAL_211]);
const SHUANGYILIU_SET = toNormalizedSet([
  ...C9,
  ...ADDITIONAL_985,
  ...ADDITIONAL_211,
  ...ADDITIONAL_SHUANGYILIU,
]);
const QS50_SET = toNormalizedSet(QS50);
const QS100_SET = toNormalizedSet([...QS50, ...QS_51_100]);

const TIER_SETS: Record<SchoolTier, Set<string>> = {
  c9: C9_SET,
  "985": SET_985,
  "211": SET_211,
  shuangyiliu: SHUANGYILIU_SET,
  qs50: QS50_SET,
  qs100: QS100_SET,
};

/** 单校 × 单档匹配：normalize 后双向 includes，放宽对全称/简称/中英混写的容忍。 */
export function matchSchoolTier(school: string, tier: SchoolTier): boolean {
  if (!school) return false;
  const n = normalize(school);
  if (n.length < 2) return false;
  const set = TIER_SETS[tier];
  // 精确命中
  if (set.has(n)) return true;
  // 包含命中（学校名里含 tier 条目，或反之）
  for (const k of set) {
    if (k.length >= 3 && (n.includes(k) || k.includes(n))) return true;
  }
  return false;
}

/** 多校（取教育经历里最好的一所）× 全部档次 → flags。 */
export function detectSchoolTiers(
  schools: (string | undefined | null)[],
): Record<SchoolTier, boolean> {
  const tiers: SchoolTier[] = ["c9", "985", "211", "shuangyiliu", "qs50", "qs100"];
  const flags: Record<SchoolTier, boolean> = {
    c9: false,
    "985": false,
    "211": false,
    shuangyiliu: false,
    qs50: false,
    qs100: false,
  };
  for (const s of schools) {
    if (!s) continue;
    for (const t of tiers) {
      if (!flags[t] && matchSchoolTier(s, t)) flags[t] = true;
    }
  }
  return flags;
}
