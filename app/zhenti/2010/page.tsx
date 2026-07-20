"use client";

import { useState, useRef, useEffect } from "react";
import Layout from "@/components/layout";

// ---- 数据 ----

interface QuestionData {
  options: string[];
  explanation: string;
}

const questions: QuestionData[] = [
  { options: ["affected", "achieved", "extracted", "restored"], explanation: '<b>【解析】[A] affected (影响)</b><br>句意：他们希望了解车间照明如何<b>影响</b>工人的生产率。achieved(达到)；extracted(提取)；restored(恢复)。根据语境，照明强弱是对生产率产生"影响"。' },
  { options: ["at", "up", "with", "off"], explanation: '<b>【解析】[B] up (最终成为/做某事)</b><br>考查固定搭配。end up doing sth. 意为"最终成为..."。句意：相反，这些研究最终以它们的名字命名了"霍桑效应"。' },
  { options: ["truth", "sight", "act", "proof"], explanation: '<b>【解析】[C] act (行为)</b><br>句意：被实验的这个<b>行为</b>本身就改变了受试者的表现。the very act of... 意为"...的行为本身"。' },
  { options: ["controversial", "perplexing", "mischievous", "ambiguous"], explanation: '<b>【解析】[B] perplexing (令人费解的)</b><br>句意：这个想法源于工厂女工们<b>令人费解的</b>行为。下文提到"不管是增加照明还是调暗照明，产量都上升了"，这种现象是"令人费解的"。controversial(有争议的)；mischievous(恶作剧的)；ambiguous(模棱两可的)。' },
  { options: ["requirements", "explanations", "accounts", "assessments"], explanation: '<b>【解析】[C] accounts (报告，记载)</b><br>句意：根据实验的<b>记载/报告</b>，当照明增加时，她们的小时产量增加了...。account 在此意为"记录，描述"。requirements(要求)；explanations(解释)；assessments(评估)。' },
  { options: ["conclude", "matter", "indicate", "work"], explanation: '<b>【解析】[B] matter (要紧，有关系)</b><br>句意：实验中做了什么似乎<b>无关紧要</b>。It did not matter... 是固定句型，意为"...无关紧要"。' },
  { options: ["as far as", "for fear that", "in case that", "so long as"], explanation: '<b>【解析】[D] so long as (只要)</b><br>句意：<b>只要</b>有东西被改变，生产率就会上升。as far as(就...而言)；for fear that(唯恐)；in case that(以防)。这里表示条件。' },
  { options: ["awareness", "expectation", "sentiment", "illusion"], explanation: '<b>【解析】[A] awareness (意识)</b><br>句意：一种意识到自己正在被实验的<b>意识</b>。expectation(期望)；sentiment(情绪)；illusion(错觉)。此处指受试者知道自己在参与实验的心理意识。' },
  { options: ["suitable", "excessive", "enough", "abundant"], explanation: '<b>【解析】[C] enough (足够的)</b><br>句意：这种意识似乎<b>足以</b>改变工人的行为。be enough to do sth. 足以做某事。' },
  { options: ["about", "for", "on", "by"], explanation: '<b>【解析】[D] by (本身)</b><br>考查固定搭配。by itself 意为"本身自动地，单独地"。句意：足以改变工人行为的<b>本身</b>。' },
  { options: ["compared", "shown", "subjected", "conveyed"], explanation: '<b>【解析】[C] subjected (使经受，遭受)</b><br>句意：几十年后，相同的数据<b>被用于</b>计量经济学分析。be subjected to sth. 意为"经受，遭受，被进行(分析等)"。' },
  { options: ["Contrary to", "Consistent with", "Parallel with", "Peculiar to"], explanation: '<b>【解析】[A] Contrary to (与...相反)</b><br>句意：<b>与</b>记录的描述<b>相反</b>，没有发现系统证据表明...。Consistent with(与...一致)；Parallel with(与...平行)；Peculiar to(...特有的)。' },
  { options: ["evidence", "guidance", "implication", "source"], explanation: '<b>【解析】[A] evidence (证据)</b><br>句意：没有发现系统的<b>证据</b>表明生产率水平与照明变化有关。guidance(指导)；implication(暗示)；source(来源)。' },
  { options: ["disputable", "enlightening", "reliable", "misleading"], explanation: '<b>【解析】[D] misleading (误导性的)</b><br>句意：进行实验的特殊方式可能导致了对所发生事情的<b>误导性</b>解释。根据前文，之前的结论被推翻了，所以以前的解释是"误导人的"。disputable(有争议的)；enlightening(有启发性的)；reliable(可靠的)。' },
  { options: ["In contrast", "For example", "In consequence", "As usual"], explanation: '<b>【解析】[B] For example (例如)</b><br>句意：<b>例如</b>，照明总是在星期天改变。此处是对上一句"特殊方式"的具体举例说明。' },
  { options: ["duly", "accidentally", "unpredictably", "suddenly"], explanation: '<b>【解析】[A] duly (适时地，如期地)</b><br>句意：当周一重新开工时，产量与上周六相比<b>如期</b>上升。accidentally(偶然地)；unpredictably(不可预测地)；suddenly(突然地)。' },
  { options: ["failed", "ceased", "started", "continued"], explanation: '<b>【解析】[D] continued (继续)</b><br>句意：产量如期上升并且在接下来的几天里<b>继续</b>上升。fail(失败)；cease(停止)；start(开始)。' },
  { options: ["Therefore", "Furthermore", "However", "Meanwhile"], explanation: '<b>【解析】[C] However (然而)</b><br>句意：<b>然而</b>，与没有进行实验的几周数据对比显示，周一的产量总是上升的。前后两句构成语义上的转折。' },
  { options: ["attempted", "tended", "chose", "intended"], explanation: '<b>【解析】[B] tended (倾向于)</b><br>句意：无论如何，工人们在一周的前几天都<b>倾向于</b>勤奋。tend to do sth. 倾向于做某事。attempted(试图)；chose(选择)；intended(打算)。' },
  { options: ["breaking", "climbing", "surpassing", "hitting"], explanation: '<b>【解析】[D] hitting (达到)</b><br>考查固定搭配。hit a plateau 意为"达到平台期，达到平稳状态"。句意：在<b>达到</b>平稳期然后松懈下来之前。' },
];

const answerKey: Record<number, string> = {
  1: 'A', 2: 'B', 3: 'C', 4: 'B', 5: 'C', 6: 'B', 7: 'D', 8: 'A', 9: 'C', 10: 'D',
  11: 'C', 12: 'A', 13: 'A', 14: 'D', 15: 'B', 16: 'A', 17: 'D', 18: 'C', 19: 'B', 20: 'D',
};

const letters = ["A", "B", "C", "D"];

// ---- DeepSeek 系统提示 ----

const passageRaw = `In 1924 America's National Research Council sent two engineers to supervise a series of experiments at a telephone-parts factory called the Hawthorne Plant near Chicago. It hoped they would learn how shop-floor lighting (1) workers' productivity. Instead, the studies ended (2) giving their name to the "Hawthorne effect," the extremely influential idea that the very (3) of being experimented upon changed subjects' behavior.
The idea arose because of the (4) behavior of the women in the plant. According to (5) of the experiments, their hourly output rose when lighting was increased, but also when it was dimmed. It did not (6) what was done in the experiment; (7) something was changed, productivity rose. A(n) (8) that they were being experimented upon seemed to be (9) to alter workers' behavior (10) itself.
After several decades, the same data were (11) to econometric analysis. The Hawthorne experiments had another surprise in store. (12) the descriptions on record, no systematic (13) was found that levels of productivity were related to changes in lighting.
It turns out that the peculiar way of conducting the experiments may have led to (14) interpretations of what happened. (15), lighting was always changed on a Sunday. When work started again on Monday, output (16) rose compared with the previous Saturday and (17) to rise for the next couple of days. (18), a comparison with data for weeks when there was no experimentation showed that output always went up on Mondays. Workers (19) to be diligent for the first few days of the week in any case, before (20) a plateau and then slackening off. This suggests that the alleged "Hawthorne effect" is hard to pin down.`;

function buildSystemPrompt() {
  let ctx = "";
  questions.forEach((q, i) => {
    ctx += `第${i + 1}题: ${q.options.map((o, j) => `[${letters[j]}]${o}`).join(" ")} (正确答案: ${answerKey[i + 1]})\n`;
  });
  return `你是一个非常专业且耐心的考研英语辅导老师。学生正在做一篇完形填空真题。你需要根据提供的文章内容、选项和正确答案，解答学生的疑问。回答要准确、易懂（遇到长难句可以用中文分析结构）。

【文章原文】（括号内数字代表题目编号）
${passageRaw}

【选项与答案】
${ctx}

约束：
1. 学生目前已经可以看到网页上默认的标准解析。所以当学生提问时，大概率是默认解析没看懂，或者想知道其他选项为什么错。你需要做出针对性的深度讲解。
2. 请使用清晰的排版，对于单词或重点使用 Markdown 加粗。
3. 态度要友好鼓励。`;
}

// ---- 组件 ----

export default function Exam2010Page() {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showExp, setShowExp] = useState<Record<number, boolean>>({});

  // 聊天状态
  const [chatOpen, setChatOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("deepseek_api_key");
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setMessages([
        {
          role: "assistant",
          content: `你好！我是你的专属考研英语助手 (基于全新 DeepSeek-V4)。\n我已经看过了上面的完形填空文章和选项。\n输入 API Key 后，如果你对**详细解析**中的某句话依然存疑，或者想让我帮你分析长难句，都可以随时问我哦！`,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSelect(qNum: number, letter: string) {
    if (submitted) return;
    setSelected((prev) => ({ ...prev, [qNum]: letter }));
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  function toggleExp(qNum: number) {
    setShowExp((prev) => ({ ...prev, [qNum]: !prev[qNum] }));
  }

  function getScore() {
    let s = 0;
    for (let i = 1; i <= 20; i++) {
      if (selected[i] === answerKey[i]) s++;
    }
    return s;
  }

  // 聊天
  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    if (!apiKey) {
      setMessages((prev) => [...prev, { role: "system", content: "请先在上方输入 DeepSeek API Key 哦！" }]);
      return;
    }
    localStorage.setItem("deepseek_api_key", apiKey);
    setInput("");
    setSending(true);
    const history = [
      { role: "system", content: buildSystemPrompt() },
      ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" as const : m.role === "user" ? "user" as const : "system" as const, content: m.content })),
      { role: "user" as const, content: text },
    ];
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "deepseek-v4-flash", messages: history.filter(m => m.role !== "system" || history.indexOf(m) === 0), temperature: 0.5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "请求失败");
      const reply = data.choices[0].message.content;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "未知错误";
      setMessages((prev) => [...prev, { role: "system", content: `请求出错: ${msg}` }]);
    } finally {
      setSending(false);
    }
  }

  const score = getScore();

  return (
    <Layout>
      {/* 标题 */}
      <h2 className="text-center text-xl font-bold text-gray-800 mb-6">
        Section I &nbsp;&nbsp;&nbsp; Use of English
      </h2>

      {/* Directions */}
      <div className="mb-6 text-base text-gray-700">
        <p><b>Directions:</b></p>
        <p>Read the following text. Choose the best word(s) for each numbered blank and mark A, B, C or D on ANSWER SHEET 1. (10 points)</p>
      </div>

      {/* 文章 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8 text-lg leading-relaxed mb-10">
        <p className="indent-8 text-justify mb-4">
          In 1924 America&apos;s National Research Council sent two engineers to supervise a series of experiments at a telephone-parts factory called the Hawthorne Plant near Chicago. It hoped they would learn how shop-floor lighting <span className="cloze-blank">1</span> workers&apos; productivity. Instead, the studies ended <span className="cloze-blank">2</span> giving their name to the &ldquo;Hawthorne effect,&rdquo; the extremely influential idea that the very <span className="cloze-blank">3</span> of being experimented upon changed subjects&apos; behavior.
        </p>
        <p className="indent-8 text-justify mb-4">
          The idea arose because of the <span className="cloze-blank">4</span> behavior of the women in the plant. According to <span className="cloze-blank">5</span> of the experiments, their hourly output rose when lighting was increased, but also when it was dimmed. It did not <span className="cloze-blank">6</span> what was done in the experiment; <span className="cloze-blank">7</span> something was changed, productivity rose. A(n) <span className="cloze-blank">8</span> that they were being experimented upon seemed to be <span className="cloze-blank">9</span> to alter workers&apos; behavior <span className="cloze-blank">10</span> itself.
        </p>
        <p className="indent-8 text-justify mb-4">
          After several decades, the same data were <span className="cloze-blank">11</span> to econometric analysis. The Hawthorne experiments had another surprise in store. <span className="cloze-blank">12</span> the descriptions on record, no systematic <span className="cloze-blank">13</span> was found that levels of productivity were related to changes in lighting.
        </p>
        <p className="indent-8 text-justify mb-4">
          It turns out that the peculiar way of conducting the experiments may have led to <span className="cloze-blank">14</span> interpretations of what happened. <span className="cloze-blank">15</span>, lighting was always changed on a Sunday. When work started again on Monday, output <span className="cloze-blank">16</span> rose compared with the previous Saturday and <span className="cloze-blank">17</span> to rise for the next couple of days. <span className="cloze-blank">18</span>, a comparison with data for weeks when there was no experimentation showed that output always went up on Mondays. Workers <span className="cloze-blank">19</span> to be diligent for the first few days of the week in any case, before <span className="cloze-blank">20</span> a plateau and then slackening off. This suggests that the alleged &ldquo;Hawthorne effect&rdquo; is hard to pin down.
        </p>
      </div>

      {/* 选项 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8 mb-10">
        {questions.map((q, idx) => {
          const qNum = idx + 1;
          const chosen = selected[qNum];
          const correct = answerKey[qNum];
          return (
            <div key={qNum} className="mb-4 pb-4 border-b border-dashed border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex flex-wrap gap-2">
                <span className="w-10 text-left font-bold text-gray-700 pt-2">{qNum}.</span>
                {q.options.map((opt, oi) => {
                  const letter = letters[oi];
                  const isChosen = chosen === letter;
                  const isCorrect = letter === correct;
                  let cls = "flex-1 min-w-[140px] cursor-pointer rounded-md px-3 py-2 text-sm transition-colors border ";
                  if (submitted && isCorrect) {
                    cls += "bg-green-100 text-green-800 border-green-300 font-semibold";
                  } else if (submitted && isChosen && !isCorrect) {
                    cls += "bg-red-100 text-red-800 border-red-300 line-through";
                  } else if (isChosen) {
                    cls += "bg-blue-50 text-blue-700 border-blue-300";
                  } else {
                    cls += "bg-gray-50 text-gray-700 border-transparent hover:bg-gray-100";
                  }
                  if (submitted) cls += " cursor-default";
                  return (
                    <label key={letter} className={cls} onClick={() => handleSelect(qNum, letter)}>
                      <input type="radio" name={`q${qNum}`} value={letter} checked={isChosen} onChange={() => {}} disabled={submitted} className="mr-2" />
                      [{letter}] {opt}
                    </label>
                  );
                })}
              </div>

              {/* 解析按钮 & 内容 */}
              {submitted && (
                <div className="mt-2 ml-10">
                  <button
                    onClick={() => toggleExp(qNum)}
                    className="text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    {showExp[qNum] ? "收起解析 ▲" : "查看解析 ▼"}
                  </button>
                  {showExp[qNum] && (
                    <div className="mt-2 border-l-4 border-blue-500 bg-gray-50 rounded-r-md p-3 text-sm text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: q.explanation }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 交卷 */}
      <div className="text-center bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-24">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-10 py-3 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
          >
            交卷并对答案
          </button>
        ) : (
          <div className="text-2xl font-bold text-red-500">
            你的得分: {score} / 20
            <div className="text-lg font-normal text-gray-500 mt-1">(折合考研分值: {score * 0.5} points)</div>
          </div>
        )}
      </div>

      {/* ---- DeepSeek 答疑悬浮框 ---- */}
      <div className="fixed bottom-5 right-5 z-50 font-sans">
        {chatOpen && (
          <div className="w-[360px] h-[500px] bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col overflow-hidden mb-4">
            <div className="bg-indigo-600 text-white px-4 py-3 font-bold flex justify-between items-center">
              <span>🤖 DeepSeek V4 答疑助手</span>
              <button onClick={() => setChatOpen(false)} className="text-white text-xl">&times;</button>
            </div>
            <div className="p-3 bg-gray-50 border-b flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="DeepSeek API Key"
                className="flex-1 px-2 py-1.5 border rounded text-xs"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3 text-sm">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3 py-2 rounded-lg whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white self-end rounded-br-none"
                      : m.role === "system"
                      ? "bg-red-100 text-red-800 self-center text-xs text-center"
                      : "bg-white border text-gray-800 self-start rounded-bl-none"
                  }`}
                  dangerouslySetInnerHTML={
                    m.role !== "system"
                      ? { __html: m.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>") }
                      : { __html: m.content }
                  }
                />
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex p-3 border-t bg-white gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="例如：第4题为什么不选A？"
                className="flex-1 px-3 py-2 border rounded-full text-sm outline-none focus:border-indigo-500"
              />
              <button
                onClick={sendMessage}
                disabled={sending}
                className="bg-indigo-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                {sending ? "思考中..." : "发送"}
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-indigo-600 text-white px-5 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          💬 DeepSeek 答疑
        </button>
      </div>
    </Layout>
  );
}
