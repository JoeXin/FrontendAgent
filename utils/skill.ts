// ========== Skill 技能系统 新增 ==========
import fs from 'fs';
import path from 'path';

interface Skill {
  name: string;
  triggerWords: string[];
  systemPrompt: string;
}

// 加载所有skill
function loadAllSkills(): Skill[] {
  const skillsPath = path.resolve(__dirname, './skills');
  if (!fs.existsSync(skillsPath)) return [];

  const dirs = fs.readdirSync(skillsPath);
  const skills: Skill[] = [];

  for (const dir of dirs) {
    const skillMdPath = path.join(skillsPath, dir, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;

    const content = fs.readFileSync(skillMdPath, 'utf8');
    // 提取description里的触发词
    const descMatch = content.match(/description:\s*(.+)/);
    const desc = descMatch ? descMatch[1] : '';
    const triggerWords = desc.replace(/用户问|时触发|、/g,' ').split(/\s+/).filter(w=>w.length>1);

    skills.push({
      name: dir,
      triggerWords,
      systemPrompt: content
    });
  }
  return skills;
}

// 预加载技能
const globalSkills = loadAllSkills();

// 匹配是否命中某个Skill
function matchSkill(question: string): Skill | null {
  const q = question.toLowerCase();
  for (const s of globalSkills) {
    if (s.triggerWords.some(word => q.includes(word))) {
      return s;
    }
  }
  return null;
}

export { matchSkill, globalSkills, loadAllSkills };