import {writeFileSync} from 'node:fs';
import {roadmap,lessons} from '../dist/content/index.mjs';
import {labs} from '../dist/labs.mjs';

const modules=roadmap.map(module=>({
  id:module.id,
  title:module.title,
  prerequisites:module.requires,
  learningOutcome:module.outcome,
  status:module.chapters.every(chapter=>lessons[chapter.id])?'complete':'partial',
  chapters:module.chapters.map(chapter=>{
    const lesson=lessons[chapter.id];
    return {
      id:chapter.id,
      title:chapter.title,
      topics:[{title:chapter.title,lessonIds:[chapter.id]}],
      lessons:[{
        id:chapter.id,
        title:lesson?.title??chapter.title,
        status:lesson?'complete':'planned',
        lab:lesson?.lab??null,
        assessmentItems:lesson?.questions.length??0
      }]
    };
  })
}));
const published=Object.values(lessons);
const lessonCount=modules.reduce((total,module)=>total+module.chapters.length,0);
const coverage={
  schemaVersion:1,
  modulesTotal:modules.length,
  lessonsPublished:published.length,
  lessonsPlanned:lessonCount-published.length,
  labsImplemented:Object.keys(labs).length,
  assessmentItems:published.reduce((sum,lesson)=>sum+lesson.questions.length,0),
  modules
};
writeFileSync(new URL('../curriculum-coverage.json',import.meta.url),JSON.stringify(coverage,null,2)+'\n');
console.log('Coverage:',JSON.stringify({modules:coverage.modulesTotal,published:coverage.lessonsPublished,planned:coverage.lessonsPlanned,labs:coverage.labsImplemented,questions:coverage.assessmentItems}));
