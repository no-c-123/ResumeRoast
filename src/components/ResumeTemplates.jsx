// ATS-Friendly Resume Templates
// All templates use single-column layouts, standard fonts, and avoid graphics/tables

// Helper function to auto-fix dates if they're entered backwards
const formatDateRange = (startDate, endDate, isCurrent) => {
    if (!startDate && !endDate) return '';

    // Auto-fix if dates are backwards (start is more recent than end)
    let actualStart = startDate;
    let actualEnd = endDate;

    if (startDate && endDate && startDate > endDate) {
        actualStart = endDate;
        actualEnd = startDate;
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const start = formatDate(actualStart);
    const end = isCurrent ? 'Present' : formatDate(actualEnd);

    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    return end;
};

const parseSkills = (skillsString) => {
    if (!skillsString) return null;
    
    // Check if it looks like structured data (contains colons for categories)
    if (skillsString.includes(':')) {
        const categories = {};
        let isStructured = false;
        
        // Split by pipe separator used in SkillsEditor
        const parts = skillsString.split('|');
        
        parts.forEach(part => {
            const splitIndex = part.indexOf(':');
            if (splitIndex !== -1) {
                const label = part.substring(0, splitIndex).trim();
                const content = part.substring(splitIndex + 1).trim();
                if (label && content) {
                    categories[label] = content;
                    isStructured = true;
                }
            }
        });

        if (isStructured) {
            return { type: 'structured', data: categories };
        }
    }
    
    return { type: 'flat', data: skillsString };
};

export const renderTemplate = ({ selectedTemplate, templates, profile, hasWorkExperience, workExperience, hasEducation, education, hasProjects, projects, customSections = [] }) => {
    const template = templates.find(t => t.id === selectedTemplate);
    const accentColor = template?.color || '#2563eb';

    if (selectedTemplate === 'professional') {
        return (
            <>
                <div className="text-center mb-6 pb-4 border-b-2" style={{ borderColor: accentColor }}>
                    <h1 className="text-3xl font-bold mb-2 tracking-tight text-neutral-900">{profile.full_name || 'Your Name'}</h1>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-neutral-700">
                        {profile.location && <span>{profile.location}</span>}
                        {profile.phone && <span>|</span>}
                        {profile.phone && <span>{profile.phone}</span>}
                        {profile.email && <span>|</span>}
                        {profile.email && <span>{profile.email}</span>}
                        {profile.linkedin && <span>|</span>}
                        {profile.linkedin && <span>LinkedIn Profile</span>}
                    </div>
                </div>

                {hasEducation && education && education.length > 0 && education.some(edu => edu && (edu.school || edu.degree)) && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: accentColor }}>Education</h2>
                        {education.map((edu, index) => (
                            edu && (edu.school || edu.degree) ? (
                                <div key={edu.id || index} className="mb-4">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-base text-neutral-900">{edu.degree || 'Degree'}</h3>
                                        <div className="text-right">
                                            <span className="text-sm text-neutral-600 whitespace-nowrap block">
                                                {formatDateRange(edu.start_date, edu.end_date, edu.current)}
                                            </span>
                                            {edu.location && <span className="text-xs text-neutral-500 block">{edu.location}</span>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-neutral-700 font-medium">{edu.school}</p>
                                    {edu.field && (
                                        <p className="text-sm text-neutral-800">{edu.field}
                                        </p>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {profile.professional_summary && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: accentColor }}>Professional Summary</h2>
                        <p className="text-neutral-800 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: profile.professional_summary }} />
                    </div>
                )}

                {profile.skills && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: accentColor }}>Skills</h2>
                        {(() => {
                            const parsed = parseSkills(profile.skills);
                            if (parsed.type === 'structured') {
                                return (
                                    <div className="text-neutral-800 text-sm leading-relaxed space-y-1">
                                        {Object.entries(parsed.data).map(([cat, skills]) => (
                                            <div key={cat}>
                                                <span className="font-bold">{cat}: </span>
                                                <span>{skills}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <p className="text-neutral-800 text-sm leading-relaxed">
                                    {parsed.data.split(',').map(s => s.trim()).join(' • ')}
                                </p>
                            );
                        })()}
                    </div>
                )}

                {hasWorkExperience && workExperience && workExperience.length > 0 && workExperience.some(exp => exp && (exp.company || exp.position)) && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: accentColor }}>Work Experience</h2>
                        {workExperience.map((exp, index) => (
                            exp && (exp.company || exp.position) ? (
                                <div key={exp.id || index} className="mb-4">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-base text-neutral-900">{exp.position || 'Position'}</h3>
                                        <div className="text-right">
                                            <span className="text-sm text-neutral-600 whitespace-nowrap block">
                                                {formatDateRange(exp.start_date, exp.end_date, exp.current)}
                                            </span>
                                            {exp.location && <span className="text-xs text-neutral-500 block">{exp.location}</span>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-neutral-700 mb-2 font-medium">{exp.company}</p>
                                    {exp.description && (
                                        <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: exp.description }} />
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {(hasProjects || (projects || profile.projects || []).some(p => p && p.title && p.title.toString().trim() !== '')) && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: accentColor }}>Projects</h2>
                        {(projects || profile.projects || []).map((p, i) => (
                            p && p.title ? (
                                <div key={i} className="mb-3">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-base text-neutral-900">
                                            {p.link ? (
                                                <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-neutral-800 hover:underline">{p.title}</a>
                                            ) : p.title}
                                        </h3>
                                    </div>
                                    {p.tech && <p className="text-sm text-neutral-700 mb-1">{p.tech}</p>}
                                    {p.description && <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: p.description }} />}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {customSections && customSections.map(section => (
                    <div key={section.id} className="mb-5">
                        <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: accentColor }}>{section.name}</h2>
                        {section.items.map((item, i) => (
                            <div key={item.id || i} className="mb-3">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-base text-neutral-900">{item.title}</h3>
                                    {item.subtitle && <span className="text-sm text-neutral-600">{item.subtitle}</span>}
                                </div>
                                {item.description && (
                                    <div className="text-sm text-neutral-800 leading-relaxed">
                                        {item.description.includes('•') || item.description.includes('\n') ? (
                                            <ul className="list-disc ml-5 space-y-1">
                                                {item.description.split(/[\r\n]+/).map((line, i) => {
                                                    const trimmed = line.trim().replace(/^•\s*/, '');
                                                    return trimmed ? <li key={i}>{trimmed}</li> : null;
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="whitespace-pre-line">{item.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {profile.volunteering && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: accentColor }}>Volunteering</h2>
                        <p className="text-neutral-800 text-sm leading-relaxed">{profile.volunteering}</p>
                    </div>
                )}
            </>
        );
    }

    // Executive Template - Garamond
    if (selectedTemplate === 'executive') {
        return (
            <>
                <div className="mb-6">
                    <h1 className="text-4xl font-bold mb-2" style={{ color: accentColor }}>{profile.full_name || 'Your Name'}</h1>
                    <div className="text-sm text-neutral-700 space-y-1">
                        {profile.location && <div>{profile.location}</div>}
                        {profile.phone && <div>{profile.phone}</div>}
                        {profile.email && <div>{profile.email}</div>}
                        {profile.linkedin && <div>LinkedIn Profile</div>}
                    </div>
                </div>

                {hasEducation && education && education.length > 0 && education.some(edu => edu && (edu.school || edu.degree)) && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3 pb-2 border-b-2" style={{ borderColor: accentColor }}>EDUCATION</h2>
                        {education.map((edu, index) => (
                            edu && (edu.school || edu.degree) ? (
                                <div key={edu.id || index} className="mb-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg text-neutral-900">{edu.degree || 'Degree'}</h3>
                                        {edu.location && <span className="text-sm text-neutral-600">{edu.location}</span>}
                                    </div>
                                    <div className="text-sm text-neutral-700 font-medium">{edu.school}</div>
                                    <div className="text-sm text-neutral-600 italic">
                                        {edu.start_date && new Date(edu.start_date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        {edu.start_date && ' - '}
                                        {edu.current ? 'Present' : edu.end_date && new Date(edu.end_date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </div>
                                    {edu.field && (
                                        <div className="text-sm text-neutral-800 mt-1">{edu.field}</div>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {profile.professional_summary && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3 pb-2 border-b-2" style={{ borderColor: accentColor }}>PROFESSIONAL SUMMARY</h2>
                        <p className="text-neutral-800 text-sm leading-loose">{profile.professional_summary}</p>
                    </div>
                )}

                {hasWorkExperience && workExperience && workExperience.length > 0 && workExperience.some(exp => exp && (exp.company || exp.position)) && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3 pb-2 border-b-2" style={{ borderColor: accentColor }}>PROFESSIONAL EXPERIENCE</h2>
                        {workExperience.map((exp, index) => (
                            exp && (exp.company || exp.position) ? (
                                <div key={exp.id || index} className="mb-5">
                                    <div className="mb-2">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg text-neutral-900" style={{ color: accentColor }}>{exp.position || 'Position'}</h3>
                                            {exp.location && <span className="text-sm text-neutral-600">{exp.location}</span>}
                                        </div>
                                        <div className="text-sm text-neutral-700 font-medium">{exp.company}</div>
                                        <div className="text-sm text-neutral-600 italic">
                                            {exp.start_date && new Date(exp.start_date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            {exp.start_date && ' - '}
                                            {exp.current ? 'Present' : exp.end_date && new Date(exp.end_date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    {exp.description && (
                                        <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line">{exp.description}</p>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}



                {profile.skills && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3 pb-2 border-b-2" style={{ borderColor: accentColor }}>SKILLS</h2>
                        {(() => {
                            const parsed = parseSkills(profile.skills);
                            if (parsed.type === 'structured') {
                                return (
                                    <div className="text-neutral-800 text-sm leading-relaxed space-y-1">
                                        {Object.entries(parsed.data).map(([cat, skills]) => (
                                            <div key={cat}>
                                                <span className="font-bold">{cat}: </span>
                                                <span>{skills}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <p className="text-neutral-800 text-sm leading-relaxed">
                                    {parsed.data.split(',').map(s => s.trim()).join(' • ')}
                                </p>
                            );
                        })()}
                    </div>
                )}

                {(hasProjects || (projects || profile.projects || []).some(p => p && p.title && p.title.toString().trim() !== '')) && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: accentColor }}>Projects</h2>
                        {(projects || profile.projects || []).map((p, i) => (
                            p && p.title ? (
                                <div key={i} className="mb-3">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-base text-neutral-900">
                                            {p.link ? (
                                                <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-neutral-800 hover:underline">{p.title}</a>
                                            ) : p.title}
                                        </h3>
                                    </div>
                                    {p.tech && <p className="text-sm text-neutral-700 mb-1">{p.tech}</p>}
                                    {p.description && <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line">{p.description}</p>}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {customSections && customSections.map(section => (
                    <div key={section.id} className="mb-6">
                        <h2 className="text-xl font-bold mb-3 pb-2 border-b-2" style={{ borderColor: accentColor }}>{section.name.toUpperCase()}</h2>
                        {section.items.map((item, i) => (
                            <div key={item.id || i} className="mb-3">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-lg text-neutral-900">{item.title}</h3>
                                    {item.subtitle && <span className="text-sm text-neutral-600 italic">{item.subtitle}</span>}
                                </div>
                                {item.description && (
                                    <div className="text-sm text-neutral-800 leading-relaxed">
                                        {item.description.includes('•') || item.description.includes('\n') ? (
                                            <ul className="list-disc ml-5 space-y-1">
                                                {item.description.split(/[\r\n]+/).map((line, i) => {
                                                    const trimmed = line.trim().replace(/^•\s*/, '');
                                                    return trimmed ? <li key={i}>{trimmed}</li> : null;
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="whitespace-pre-line">{item.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {profile.volunteering && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3 pb-2 border-b-2" style={{ borderColor: accentColor }}>VOLUNTEERING</h2>
                        <p className="text-neutral-800 text-sm leading-relaxed">{profile.volunteering}</p>
                    </div>
                )}
            </>
        );
    }

    // Modern Template - Calibri
    if (selectedTemplate === 'modern') {
        return (
            <>
                <div className="mb-6 pb-4 border-b-4" style={{ borderColor: accentColor }}>
                    <h1 className="text-3xl font-bold mb-2 text-neutral-900">{profile.full_name || 'Your Name'}</h1>
                    <div className="flex flex-wrap gap-3 text-sm text-neutral-700">
                        {profile.location && <span>{profile.location}</span>}
                        {profile.phone && <span>{profile.phone}</span>}
                        {profile.email && <span>{profile.email}</span>}
                        {profile.linkedin && <span>LinkedIn</span>}
                    </div>
                </div>

                {hasEducation && education && education.length > 0 && education.some(edu => edu && (edu.school || edu.degree)) && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 tracking-wide" style={{ color: accentColor }}>EDUCATION</h2>
                        {education.map((edu, index) => (
                            edu && (edu.school || edu.degree) ? (
                                <div key={edu.id || index} className="mb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-base text-neutral-900">{edu.degree || 'Degree'}</div>
                                        {edu.location && <div className="text-xs text-neutral-500">{edu.location}</div>}
                                    </div>
                                    <div className="text-sm text-neutral-700">{edu.school}</div>
                                    <div className="text-sm text-neutral-600">
                                        {formatDateRange(edu.start_date, edu.end_date, edu.current)}
                                    </div>
                                    {edu.field && (
                                        <div className="text-sm text-neutral-800">{edu.field}</div>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {profile.professional_summary && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 tracking-wide" style={{ color: accentColor }}>PROFILE</h2>
                        <p className="text-neutral-800 text-sm leading-relaxed">{profile.professional_summary}</p>
                    </div>
                )}

                {(hasProjects || (projects || profile.projects || []).some(p => p && p.title && p.title.toString().trim() !== '')) && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 tracking-wide" style={{ color: accentColor }}>Projects</h2>
                        {(projects || profile.projects || []).map((p, i) => (
                            p && p.title ? (
                                <div key={i} className="mb-3">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-base text-neutral-900">
                                            {p.link ? (
                                                <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-neutral-800 hover:underline">{p.title}</a>
                                            ) : p.title}
                                        </h3>
                                    </div>
                                    {p.tech && <p className="text-sm text-neutral-700 mb-1">{p.tech}</p>}
                                    {p.description && <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line">{p.description}</p>}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {customSections && customSections.map(section => (
                    <div key={section.id} className="mb-5">
                        <h2 className="text-lg font-bold mb-2 tracking-wide" style={{ color: accentColor }}>{section.name}</h2>
                        {section.items.map((item, i) => (
                            <div key={item.id || i} className="mb-3">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-base text-neutral-900">{item.title}</h3>
                                    {item.subtitle && <span className="text-sm text-neutral-600">{item.subtitle}</span>}
                                </div>
                                {item.description && (
                                    <div className="text-sm text-neutral-800 leading-relaxed">
                                        {item.description.includes('•') || item.description.includes('\n') ? (
                                            <ul className="list-disc ml-5 space-y-1">
                                                {item.description.split(/[\r\n]+/).map((line, i) => {
                                                    const trimmed = line.trim().replace(/^•\s*/, '');
                                                    return trimmed ? <li key={i}>{trimmed}</li> : null;
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="whitespace-pre-line">{item.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {profile.skills && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 tracking-wide" style={{ color: accentColor }}>CORE COMPETENCIES</h2>
                        {(() => {
                            const parsed = parseSkills(profile.skills);
                            if (parsed.type === 'structured') {
                                return (
                                    <div className="text-neutral-800 text-sm leading-relaxed space-y-1">
                                        {Object.entries(parsed.data).map(([cat, skills]) => (
                                            <div key={cat}>
                                                <span className="font-bold">{cat}: </span>
                                                <span>{skills}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <div className="text-neutral-800 text-sm leading-relaxed">
                                    {parsed.data.split(',').map(s => s.trim()).join(' | ')}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {hasWorkExperience && workExperience && workExperience.length > 0 && workExperience.some(exp => exp && (exp.company || exp.position)) && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 tracking-wide" style={{ color: accentColor }}>PROFESSIONAL EXPERIENCE</h2>
                        {workExperience.map((exp, index) => (
                            exp && (exp.company || exp.position) ? (
                                <div key={exp.id || index} className="mb-4 pl-4 border-l-4" style={{ borderColor: accentColor }}>
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-base text-neutral-900">{exp.position || 'Position'}</div>
                                        {exp.location && <div className="text-xs text-neutral-500">{exp.location}</div>}
                                    </div>
                                    <div className="text-sm text-neutral-700 font-semibold">{exp.company}</div>
                                    <div className="text-sm text-neutral-600 mb-2">
                                        {exp.start_date && new Date(exp.start_date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        {exp.start_date && ' - '}
                                        {exp.current ? 'Present' : exp.end_date && new Date(exp.end_date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </div>
                                    {exp.description && (
                                        <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line">{exp.description}</p>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}



                {profile.volunteering && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 tracking-wide" style={{ color: accentColor }}>VOLUNTEER WORK</h2>
                        <p className="text-neutral-800 text-sm leading-relaxed">{profile.volunteering}</p>
                    </div>
                )}
            </>
        );
    }

    // Classic Template - Georgia
    if (selectedTemplate === 'classic') {
        return (
            <>
                <div className="text-center mb-6 pb-4 border-b border-neutral-400">
                    <h1 className="text-3xl font-bold mb-2 text-neutral-900">{profile.full_name || 'Your Name'}</h1>
                    <div className="text-sm text-neutral-700">
                        {[profile.location, profile.phone, profile.email, profile.linkedin && 'LinkedIn'].filter(Boolean).join(' | ')}
                    </div>
                </div>

                {hasEducation && education && education.length > 0 && education.some(edu => edu && (edu.school || edu.degree)) && (
                    <div className="mb-5">
                        <h2 className="text-base font-bold mb-2 pb-1 border-b border-neutral-300">EDUCATION</h2>
                        {education.map((edu, index) => (
                            edu && (edu.school || edu.degree) ? (
                                <div key={edu.id || index} className="mb-3">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-base text-neutral-900">{edu.degree || 'Degree'}</h3>
                                        <div className="text-right">
                                            <span className="text-sm text-neutral-600 block">
                                                {formatDateRange(edu.start_date, edu.end_date, edu.current)}
                                            </span>
                                            {edu.location && <span className="text-xs text-neutral-500 block">{edu.location}</span>}
                                        </div>
                                    </div>
                                    <div className="text-sm text-neutral-700 italic">{edu.school}</div>
                                    {edu.field && (
                                        <div className="text-sm text-neutral-800">{edu.field}</div>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {profile.professional_summary && (
                    <div className="mb-5">
                        <h2 className="text-base font-bold mb-2 pb-1 border-b border-neutral-300">SUMMARY</h2>
                        <p className="text-neutral-800 text-sm leading-loose">{profile.professional_summary}</p>
                    </div>
                )}

                {profile.skills && (
                    <div className="mb-5">
                        <h2 className="text-base font-bold mb-2 pb-1 border-b border-neutral-300">SKILLS</h2>
                        {(() => {
                            const parsed = parseSkills(profile.skills);
                            if (parsed.type === 'structured') {
                                return (
                                    <div className="text-neutral-800 text-sm leading-relaxed space-y-1">
                                        {Object.entries(parsed.data).map(([cat, skills]) => (
                                            <div key={cat}>
                                                <span className="font-bold">{cat}: </span>
                                                <span>{skills}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <p className="text-neutral-800 text-sm leading-relaxed">
                                    {parsed.data.split(',').map(s => s.trim()).join(' • ')}
                                </p>
                            );
                        })()}
                    </div>
                )}

                {hasWorkExperience && workExperience && workExperience.length > 0 && workExperience.some(exp => exp && (exp.company || exp.position)) && (
                    <div className="mb-5">
                        <h2 className="text-base font-bold mb-2 pb-1 border-b border-neutral-300">EXPERIENCE</h2>
                        {workExperience.map((exp, index) => (
                            exp && (exp.company || exp.position) ? (
                                <div key={exp.id || index} className="mb-4">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-base text-neutral-900">{exp.position || 'Position'}</h3>
                                        <div className="text-right">
                                            <span className="text-sm text-neutral-600 block">
                                                {formatDateRange(exp.start_date, exp.end_date, exp.current)}
                                            </span>
                                            {exp.location && <span className="text-xs text-neutral-500 block">{exp.location}</span>}
                                        </div>
                                    </div>
                                    <div className="text-sm text-neutral-700 italic mb-2">{exp.company}</div>
                                    {exp.description && (
                                        <p className="text-sm text-neutral-800 leading-loose whitespace-pre-line">{exp.description}</p>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}



                {(hasProjects || (projects || profile.projects || []).some(p => p && p.title && p.title.toString().trim() !== '')) && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: accentColor }}>Projects</h2>
                        {(projects || profile.projects || []).map((p, i) => (
                            p && p.title ? (
                                <div key={i} className="mb-3">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-base text-neutral-900">
                                            {p.link ? (
                                                <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-neutral-800 hover:underline">{p.title}</a>
                                            ) : p.title}
                                        </h3>
                                    </div>
                                    {p.tech && <p className="text-sm text-neutral-700 mb-1">{p.tech}</p>}
                                    {p.description && <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line">{p.description}</p>}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {customSections && customSections.map(section => (
                    <div key={section.id} className="mb-5">
                        <h2 className="text-base font-bold mb-2 pb-1 border-b border-neutral-300">{section.name.toUpperCase()}</h2>
                        {section.items.map((item, i) => (
                            <div key={item.id || i} className="mb-3">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-base text-neutral-900">{item.title}</h3>
                                    {item.subtitle && <span className="text-sm text-neutral-600">{item.subtitle}</span>}
                                </div>
                                {item.description && (
                                    <div className="text-sm text-neutral-800 leading-relaxed">
                                        {item.description.includes('•') || item.description.includes('\n') ? (
                                            <ul className="list-disc ml-5 space-y-1">
                                                {item.description.split(/[\r\n]+/).map((line, i) => {
                                                    const trimmed = line.trim().replace(/^•\s*/, '');
                                                    return trimmed ? <li key={i}>{trimmed}</li> : null;
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="whitespace-pre-line">{item.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {profile.volunteering && (
                    <div className="mb-5">
                        <h2 className="text-lg font-bold mb-2 tracking-wide" style={{ color: accentColor }}>Volunteering</h2>
                        <p className="text-neutral-800 text-sm leading-loose">{profile.volunteering}</p>
                    </div>
                )}
            </>
        );
    }

    // Minimalist Template - Helvetica
    if (selectedTemplate === 'minimalist') {
        return (
            <>
                <div className="mb-8">
                    <h1 className="text-4xl font-light mb-2 tracking-tight text-neutral-900">{profile.full_name || 'Your Name'}</h1>
                    <div className="text-sm text-neutral-600 space-x-3">
                        {profile.location && <span>{profile.location}</span>}
                        {profile.phone && <span>{profile.phone}</span>}
                        {profile.email && <span>{profile.email}</span>}
                        {profile.linkedin && <span>LinkedIn</span>}
                    </div>
                </div>

                {hasEducation && education && education.length > 0 && education.some(edu => edu && (edu.school || edu.degree)) && (
                    <div className="mb-6">
                        <h2 className="text-xs font-bold mb-3 uppercase tracking-widest text-neutral-500">Education</h2>
                        {education.map((edu, index) => (
                            edu && (edu.school || edu.degree) ? (
                                <div key={edu.id || index} className="mb-4">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-base text-neutral-900">{edu.degree || 'Degree'}</h3>
                                        <div className="text-right">
                                            <span className="text-xs text-neutral-500 block">
                                                {formatDateRange(edu.start_date, edu.end_date, edu.current)}
                                            </span>
                                            {edu.location && <span className="text-xs text-neutral-400 block">{edu.location}</span>}
                                        </div>
                                    </div>
                                    <div className="text-sm text-neutral-600">{edu.school}</div>
                                    {edu.field && (
                                        <div className="text-sm text-neutral-700">{edu.field}</div>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {profile.professional_summary && (
                    <div className="mb-6">
                        <p className="text-neutral-800 text-sm leading-relaxed">{profile.professional_summary}</p>
                    </div>
                )}

                {hasWorkExperience && workExperience && workExperience.length > 0 && workExperience.some(exp => exp && (exp.company || exp.position)) && (
                    <div className="mb-6">
                        <h2 className="text-xs font-bold mb-3 uppercase tracking-widest text-neutral-500">Experience</h2>
                        {workExperience.map((exp, index) => (
                            exp && (exp.company || exp.position) ? (
                                <div key={exp.id || index} className="mb-5">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-base text-neutral-900">{exp.position || 'Position'}</h3>
                                        <div className="text-right">
                                            <span className="text-xs text-neutral-500 block">
                                                {formatDateRange(exp.start_date, exp.end_date, exp.current)}
                                            </span>
                                            {exp.location && <span className="text-xs text-neutral-400 block">{exp.location}</span>}
                                        </div>
                                    </div>
                                    <div className="text-sm text-neutral-600 mb-2">{exp.company}</div>
                                    {exp.description && (
                                        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {customSections && customSections.map(section => (
                    <div key={section.id} className="mb-6">
                        <h2 className="text-xs font-bold mb-3 uppercase tracking-widest text-neutral-500">{section.name}</h2>
                        {section.items.map((item, i) => (
                            <div key={item.id || i} className="mb-3">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-semibold text-base text-neutral-900">{item.title}</h3>
                                    {item.subtitle && <span className="text-xs text-neutral-500">{item.subtitle}</span>}
                                </div>
                                {item.description && (
                                    <div className="text-sm text-neutral-700 leading-relaxed">
                                        {item.description.includes('•') || item.description.includes('\n') ? (
                                            <ul className="list-disc ml-5 space-y-1">
                                                {item.description.split(/[\r\n]+/).map((line, i) => {
                                                    const trimmed = line.trim().replace(/^•\s*/, '');
                                                    return trimmed ? <li key={i}>{trimmed}</li> : null;
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="whitespace-pre-line">{item.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {profile.skills && (
                    <div className="mb-6">
                        <h2 className="text-xs font-bold mb-3 uppercase tracking-widest text-neutral-500">Skills</h2>
                        {(() => {
                            const parsed = parseSkills(profile.skills);
                            if (parsed.type === 'structured') {
                                return (
                                    <div className="text-neutral-700 text-sm leading-relaxed space-y-1">
                                        {Object.entries(parsed.data).map(([cat, skills]) => (
                                            <div key={cat}>
                                                <span className="font-bold">{cat}: </span>
                                                <span>{skills}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <p className="text-neutral-700 text-sm leading-relaxed">
                                    {parsed.data}
                                </p>
                            );
                        })()}
                    </div>
                )}

                {profile.volunteering && (
                    <div className="mb-6">
                        <h2 className="text-xs font-bold mb-3 uppercase tracking-widest text-neutral-500">Volunteering</h2>
                        <p className="text-neutral-700 text-sm leading-relaxed">{profile.volunteering}</p>
                    </div>
                )}
            </>
        );
    }

    // Elegant Template - Lora
    if (selectedTemplate === 'elegant') {
        return (
            <>
                <div className="text-center mb-7 pb-5 border-b-2" style={{ borderColor: accentColor }}>
                    <h1 className="text-3xl font-bold mb-3 tracking-wide text-neutral-900">{profile.full_name || 'Your Name'}</h1>
                    <div className="flex justify-center gap-4 text-sm text-neutral-700">
                        {profile.location && <span>{profile.location}</span>}
                        {profile.phone && <span>•</span>}
                        {profile.phone && <span>{profile.phone}</span>}
                        {profile.email && <span>•</span>}
                        {profile.email && <span>{profile.email}</span>}
                        {profile.linkedin && <span>•</span>}
                        {profile.linkedin && <span>LinkedIn</span>}
                    </div>
                </div>

                {hasEducation && education && education.length > 0 && education.some(edu => edu && (edu.school || edu.degree)) && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-3" style={{ color: accentColor }}>Education</h2>
                        {education.map((edu, index) => (
                            edu && (edu.school || edu.degree) ? (
                                <div key={edu.id || index} className="mb-4">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-base text-neutral-900">{edu.degree || 'Degree'}</h3>
                                        <div className="text-right">
                                            <span className="text-sm text-neutral-600 italic block">
                                                {formatDateRange(edu.start_date, edu.end_date, edu.current)}
                                            </span>
                                            {edu.location && <span className="text-xs text-neutral-500 italic block">{edu.location}</span>}
                                        </div>
                                    </div>
                                    <div className="text-sm text-neutral-700 font-medium">{edu.school}</div>
                                    {edu.field && (
                                        <div className="text-sm text-neutral-800">{edu.field}</div>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {profile.professional_summary && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-3" style={{ color: accentColor }}>Professional Summary</h2>
                        <p className="text-neutral-800 text-sm leading-loose text-justify">{profile.professional_summary}</p>
                    </div>
                )}

                {profile.skills && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-3" style={{ color: accentColor }}>Core Skills</h2>
                        {(() => {
                            const parsed = parseSkills(profile.skills);
                            if (parsed.type === 'structured') {
                                return (
                                    <div className="text-neutral-800 text-sm leading-relaxed space-y-1">
                                        {Object.entries(parsed.data).map(([cat, skills]) => (
                                            <div key={cat}>
                                                <span className="font-bold">{cat}: </span>
                                                <span>{skills}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <p className="text-neutral-800 text-sm leading-relaxed">
                                    {parsed.data.split(',').map(s => s.trim()).join(' • ')}
                                </p>
                            );
                        })()}
                    </div>
                )}

                {hasWorkExperience && workExperience && workExperience.length > 0 && workExperience.some(exp => exp && (exp.company || exp.position)) && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-3" style={{ color: accentColor }}>Professional Experience</h2>
                        {workExperience.map((exp, index) => (
                            exp && (exp.company || exp.position) ? (
                                <div key={exp.id || index} className="mb-5">
                                    <div className="mb-2">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-bold text-base text-neutral-900">{exp.position || 'Position'}</h3>
                                            <div className="text-right">
                                                <span className="text-sm text-neutral-600 italic block">
                                                    {formatDateRange(exp.start_date, exp.end_date, exp.current)}
                                                </span>
                                                {exp.location && <span className="text-xs text-neutral-500 italic block">{exp.location}</span>}
                                            </div>
                                        </div>
                                        <div className="text-sm text-neutral-700 font-medium">{exp.company}</div>
                                    </div>
                                    {exp.description && (
                                        <p className="text-sm text-neutral-800 leading-loose whitespace-pre-line text-justify">{exp.description}</p>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {customSections && customSections.map(section => (
                    <div key={section.id} className="mb-6">
                        <h2 className="text-lg font-bold mb-3" style={{ color: accentColor }}>{section.name}</h2>
                        {section.items.map((item, i) => (
                            <div key={item.id || i} className="mb-3">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-base text-neutral-900">{item.title}</h3>
                                    {item.subtitle && <span className="text-sm text-neutral-600 italic">{item.subtitle}</span>}
                                </div>
                                {item.description && (
                                    <div className="text-sm text-neutral-800 leading-relaxed text-justify">
                                        {item.description.includes('•') || item.description.includes('\n') ? (
                                            <ul className="list-disc ml-5 space-y-1">
                                                {item.description.split(/[\r\n]+/).map((line, i) => {
                                                    const trimmed = line.trim().replace(/^•\s*/, '');
                                                    return trimmed ? <li key={i}>{trimmed}</li> : null;
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="whitespace-pre-line">{item.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {profile.volunteering && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-3" style={{ color: accentColor }}>Volunteer Work</h2>
                        <p className="text-neutral-800 text-sm leading-loose text-justify">{profile.volunteering}</p>
                    </div>
                )}
            </>
        );
    }


    if (selectedTemplate === 'ivy') {
        return (
            <div className="font-serif text-black">
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold mb-2 uppercase tracking-wide">{profile.full_name || 'Your Name'}</h1>
                    <div className="text-sm">
                        {[profile.email, profile.phone, profile.location, profile.linkedin && 'LinkedIn'].filter(Boolean).join('  •  ')}
                    </div>
                </div>

                {hasEducation && education && education.length > 0 && education.some(edu => edu && (edu.school || edu.degree)) && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black mb-3">Education</h2>
                        <div className="space-y-4">
                            {education.map((edu, index) => (
                                edu && (edu.school || edu.degree) ? (
                                    <div key={edu.id || index}>
                                        <div className="flex justify-between font-bold text-sm">
                                            <span>{edu.institution || edu.school}</span>
                                            <span>{formatDateRange(edu.start_date, edu.end_date, edu.current)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm italic">
                                            <span>{edu.degree}</span>
                                            <span>{edu.location}</span>
                                        </div>
                                        {edu.field && <div className="text-sm">{edu.field}</div>}
                                    </div>
                                ) : null
                            ))}
                        </div>
                    </div>
                )}

                {profile.professional_summary && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black mb-3">Professional Summary</h2>
                        <p className="text-sm leading-relaxed">{profile.professional_summary}</p>
                    </div>
                )}

                {profile.skills && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black mb-3">Skills</h2>
                        {(() => {
                            const parsed = parseSkills(profile.skills);
                            if (parsed.type === 'structured') {
                                return (
                                    <div className="text-sm leading-relaxed space-y-1">
                                        {Object.entries(parsed.data).map(([cat, skills]) => (
                                            <div key={cat}>
                                                <span className="font-bold">{cat}: </span>
                                                <span>{skills}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <p className="text-sm leading-relaxed">
                                    {parsed.data.split(',').map(skill => skill.trim()).join(' • ')}
                                </p>
                            );
                        })()}
                    </div>
                )}

                {hasWorkExperience && workExperience && workExperience.length > 0 && workExperience.some(exp => exp && (exp.company || exp.position)) && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black mb-3">Work Experience</h2>
                        <div className="space-y-4">
                            {workExperience.map((exp, index) => (
                                exp && (exp.company || exp.position) ? (
                                    <div key={exp.id || index}>
                                        <div className="flex justify-between items-baseline font-bold text-sm">
                                            <span>{exp.position || 'Position'}</span>
                                            <span>{formatDateRange(exp.start_date, exp.end_date, exp.current)}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline text-sm italic mb-2">
                                            <span>{exp.company}</span>
                                            <span>{exp.location}</span>
                                        </div>
                                        {exp.description && (
                                            <ul className="list-disc ml-5 space-y-1">
                                                {exp.description.split(/[\r\n]+/).map((line, i) => (
                                                    line.trim() && <li key={i} className="text-sm pl-1">{line.trim().replace(/^•\s*/, '')}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : null
                            ))}
                        </div>
                    </div>
                )}

                {(hasProjects || (projects || profile.projects || []).some(p => p && p.title && p.title.toString().trim() !== '')) && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black mb-3">Projects</h2>
                        <div className="space-y-4">
                            {(projects || profile.projects || []).map((p, i) => (
                                p && p.title ? (
                                    <div key={i}>
                                        <div className="flex justify-between font-bold text-sm">
                                            <span>{p.title}</span>
                                        </div>
                                        <p className="text-sm mt-1">{p.description}</p>
                                        {p.tech && <p className="text-xs text-gray-600 mt-1 italic">Tech: {p.tech}</p>}
                                    </div>
                                ) : null
                            ))}
                        </div>
                    </div>
                )}

                {customSections && customSections.map(section => (
                    <div key={section.id} className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black mb-3">{section.name}</h2>
                        <div className="space-y-4">
                            {section.items.map((item, i) => (
                                <div key={item.id || i}>
                                    <div className="flex justify-between font-bold text-sm">
                                        <span>{item.title}</span>
                                        {item.subtitle && <span>{item.subtitle}</span>}
                                    </div>
                                    {item.description && (
                                        <div className="text-sm mt-1">
                                            {item.description.includes('•') || item.description.includes('\n') ? (
                                                <ul className="list-disc ml-5 space-y-1">
                                                    {item.description.split(/[\r\n]+/).map((line, i) => {
                                                        const trimmed = line.trim().replace(/^•\s*/, '');
                                                        return trimmed ? <li key={i}>{trimmed}</li> : null;
                                                    })}
                                                </ul>
                                            ) : (
                                                <p className="whitespace-pre-line">{item.description}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};
