import React from 'react';
import { EstimationResult } from '../types';

interface ParsedItemBase {
  id: string;
}

interface ParsedKeyValueItem extends ParsedItemBase {
  type: 'key-value';
  key: string;
  value: string;
}

interface ParsedBulletItem extends ParsedItemBase {
  type: 'bullet';
  content: string;
}

interface ParsedParagraphItem extends ParsedItemBase {
  type: 'paragraph';
  content: string;
}

type ParsedItem = ParsedKeyValueItem | ParsedBulletItem | ParsedParagraphItem;

interface ParsedSection {
  id: string;
  title: string;
  items: ParsedItem[];
  isCaution?: boolean;
}

const parseEstimationText = (text: string): ParsedSection[] => {
  const sections: ParsedSection[] = [];
  const lines = text.split('\n').filter(line => line.trim() !== '' || sections.length > 0 && sections[sections.length -1].items.length > 0); // Keep empty lines if they are within item content

  let currentSection: ParsedSection | null = null;
  const headingRegex = /^(\d+)\.\s(.+)/;
  const bulletRegex = /^\s*-\s(.+)/;
  const keyValueRegex = /^([^:]+):\s(.+)/; 
  const specificKvKeysSection1 = ["構造", "種類", "延床面積", "階数"];
  const cautionHeadingText = "写真から読み取れる注意点・追加費用のリスク";

  for (const line of lines) {
    const headingMatch = line.match(headingRegex);

    if (headingMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        id: `section-${headingMatch[1]}`,
        title: headingMatch[2].trim(),
        items: [],
      };
    } else if (line.trim() === cautionHeadingText) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        id: `section-cautions`,
        title: cautionHeadingText,
        items: [],
        isCaution: true,
      };
    } else if (currentSection) {
      const bulletMatch = line.match(bulletRegex);
      const kvMatch = line.match(keyValueRegex);

      let itemAdded = false;

      // Specific Key-Value parsing for Section 1
      if (currentSection.id === 'section-1' && kvMatch && specificKvKeysSection1.includes(kvMatch[1].trim())) {
        currentSection.items.push({
          id: crypto.randomUUID(),
          type: 'key-value',
          key: kvMatch[1].trim(),
          value: kvMatch[2].trim(),
        });
        itemAdded = true;
      }
      
      if (!itemAdded) {
        if (bulletMatch) {
          currentSection.items.push({ 
            id: crypto.randomUUID(),
            type: 'bullet', 
            content: bulletMatch[1].trim() 
          });
        } else if (line.trim()) { // If not a bullet and not empty, treat as paragraph
          // If previous item was a paragraph, append to it, else create new.
          const lastItem = currentSection.items[currentSection.items.length -1];
          if(lastItem && lastItem.type === 'paragraph'){
            lastItem.content += `\n${line.trim()}`;
          } else {
            currentSection.items.push({ 
              id: crypto.randomUUID(),
              type: 'paragraph', 
              content: line.trim() 
            });
          }
        }
      }
    }
  }
  if (currentSection) sections.push(currentSection);
  return sections;
};

interface ResultsDisplayProps {
  result: EstimationResult;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const parsedSections = parseEstimationText(result.text);

  if (parsedSections.length === 0 && result.text.trim() === '') {
    return (
      <div className="mt-8 p-6 bg-slate-700 rounded-lg shadow-inner">
        <h2 className="text-2xl font-semibold text-sky-400 mb-4">AIによる現調結果</h2>
        <p className="text-slate-300">AIからの応答が空です。</p>
      </div>
    );
  }
  
  if (parsedSections.length === 0 && result.text.trim() !== '') {
     // Fallback for unparsable content
    return (
      <div className="mt-8 p-6 bg-slate-700 rounded-lg shadow-inner">
        <h2 className="text-2xl font-semibold text-sky-400 mb-4">AIによる現調結果</h2>
        <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-200 whitespace-pre-wrap">
          {result.text.split('\n').map((line, index) => (
            <React.Fragment key={index}>{line}<br /></React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-slate-700 rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold text-sky-400 mb-6">AIによる現調結果</h2>
      {parsedSections.map((section) => (
        <section
          key={section.id}
          className={`mb-6 last:mb-0 ${
            section.isCaution ? 'bg-yellow-800/30 border-l-4 border-yellow-500 p-4 rounded-md' : ''
          }`}
          aria-labelledby={section.id + '-title'}
        >
          <h3 id={section.id + '-title'} className="text-xl font-semibold text-sky-300 mb-3 border-b-2 border-slate-600 pb-2">
            {section.title}
          </h3>
          
          {section.items.filter(item => item.type === 'key-value').length > 0 && (
            <div className="space-y-1.5 mb-3">
              {(section.items.filter(item => item.type === 'key-value') as ParsedKeyValueItem[]).map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row">
                  <span className="font-medium text-slate-300 w-full sm:w-1/3 md:w-1/4 pr-2">{item.key}:</span>
                  <span className="text-slate-100 flex-1">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {section.items.filter(item => item.type === 'bullet').length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-slate-200 pl-2 mb-3">
              {(section.items.filter(item => item.type === 'bullet') as ParsedBulletItem[]).map((item) => (
                <li key={item.id}>{item.content}</li>
              ))}
            </ul>
          )}
          
          {section.items.filter(item => item.type === 'paragraph').length > 0 && (
            <div className="space-y-2 text-slate-200">
              {(section.items.filter(item => item.type === 'paragraph') as ParsedParagraphItem[]).map((item) => (
                 <p key={item.id} className="whitespace-pre-line">{item.content}</p>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
};