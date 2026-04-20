import re

with open("c:/Users/aryam/career_guidance/frontend/src/pages/ParentPortal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Wrap the grid layout
content = content.replace(
    '<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">',
    '{!isTrajectoryView ? (\n                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">'
)

# 2. Before NEW SECTION: Selected Career Strategy, close the first condition
selected_strategy_start = """                        {/* NEW SECTION: Selected Career Strategy */}"""
replacement_strategy_start = """                        </div>
                    </div>
                ) : (
                    <div className="w-full space-y-8">
                        {/* NEW SECTION: Selected Career Strategy */}"""
content = content.replace(selected_strategy_start, replacement_strategy_start)

# 3. Add Market Tab mapping
tabs_mapping_start = """                                        { id: 'roadmap', label: 'Roadmap', icon: Calendar },
                                        { id: 'schools', label: 'Schools', icon: GraduationCap },
                                        { id: 'exams', label: 'Exams', icon: Target },
                                        { id: 'grants', label: 'Scholarships', icon: Award },
                                        { id: 'myths', label: 'Fact Check', icon: FlaskConical }"""

tabs_mapping_end = """                                        { id: 'roadmap', label: 'Roadmap', icon: Calendar },
                                        { id: 'schools', label: 'Schools', icon: GraduationCap },
                                        { id: 'exams', label: 'Exams', icon: Target },
                                        { id: 'grants', label: 'Scholarships', icon: Award },
                                        { id: 'myths', label: 'Fact Check', icon: FlaskConical },
                                        { id: 'market', label: 'Market', icon: LineChart }"""
content = content.replace(tabs_mapping_start, tabs_mapping_end)

# 4. Add Market Tab Content
myths_start = """                                    {activeTab === 'myths' && ("""
market_content = """                                    {activeTab === 'market' && (
                                        <div className="space-y-6">
                                            {market ? (
                                                <div className="p-8 rounded-[2rem] bg-zinc-900 border border-white/5 space-y-6">
                                                   <h5 className="font-black text-white text-lg tracking-tight border-b border-white/5 pb-4">Market Outlook</h5>
                                                   <p className="text-sm font-bold text-zinc-400 italic mb-6">{market.market_summary || market.future_outlook || "Analyzing current job market trends..."}</p>
                                                   
                                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-primary-neon/20">
                                                          <h6 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-4">Top Employers (2025)</h6>
                                                          <ul className="space-y-3">
                                                              {((market.top_employers || []).slice(0, 4)).map((emp, i) => (
                                                                  <li key={i} className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                                      <span className="text-sm font-black text-white">{emp.name || emp.employer || emp}</span>
                                                                      {emp.type && <span className="text-[10px] text-zinc-500 font-bold uppercase">{emp.type}</span>}
                                                                  </li>
                                                              ))}
                                                              {(!market.top_employers || market.top_employers.length === 0) && (
                                                                  <span className="text-xs text-zinc-500 italic">No exact employer data available</span>
                                                              )}
                                                          </ul>
                                                      </div>
                                                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-primary-neon/20">
                                                          <h6 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-4">Salary Estimates</h6>
                                                          <div className="space-y-4">
                                                              {market.salaries ? Object.keys(market.salaries).map((key, i) => (
                                                                  <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                                      <span className="text-[9px] uppercase font-black text-zinc-400">{key.replace('_', ' ')}</span>
                                                                      <span className="text-[10px] font-black text-primary-neon tracking-wider">{market.salaries[key]}</span>
                                                                  </div>
                                                              )) : (
                                                                 <div className="text-zinc-500 uppercase font-black text-[10px]">Data loading...</div>
                                                              )}
                                                          </div>
                                                      </div>
                                                   </div>
                                                </div>
                                            ) : (
                                                <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">Loading market intelligence...</div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'myths' && ("""
content = content.replace(myths_start, market_content)

# 5. Close the conditional after the Selected Career Strategy
final_message_start = """                        {/* Final Message Card */}"""
replacement_final_message = """                    </div>
                )}

                        {/* Final Message Card */}"""
content = content.replace(final_message_start, replacement_final_message)


with open("c:/Users/aryam/career_guidance/frontend/src/pages/ParentPortal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Rewrite complete")
