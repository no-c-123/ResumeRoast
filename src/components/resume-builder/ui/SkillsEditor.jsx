import React, { useState, useEffect } from 'react';

const CATEGORY_TRANSLATIONS = {
    'English': {
        'Hard Skills': 'Hard Skills',
        'Soft Skills': 'Soft Skills',
        'Languages': 'Languages',
        'Tools': 'Tools',
        'Core Skills': 'Core Skills'
    },
    'Spanish': {
        'Hard Skills': 'Habilidades Duras',
        'Soft Skills': 'Habilidades Blandas',
        'Languages': 'Idiomas',
        'Tools': 'Herramientas',
        'Core Skills': 'Competencias Clave'
    },
    'French': {
        'Hard Skills': 'Compétences Techniques',
        'Soft Skills': 'Compétences Douces',
        'Languages': 'Langues',
        'Tools': 'Outils',
        'Core Skills': 'Compétences Clés'
    },
    'German': {
        'Hard Skills': 'Fachkompetenzen',
        'Soft Skills': 'Soziale Kompetenzen',
        'Languages': 'Sprachen',
        'Tools': 'Werkzeuge',
        'Core Skills': 'Kernkompetenzen'
    },
    'Italian': {
        'Hard Skills': 'Competenze Tecniche',
        'Soft Skills': 'Competenze Trasversali',
        'Languages': 'Lingue',
        'Tools': 'Strumenti',
        'Core Skills': 'Competenze Chiave'
    },
    'Portuguese': {
        'Hard Skills': 'Habilidades Técnicas',
        'Soft Skills': 'Habilidades Interpessoais',
        'Languages': 'Idiomas',
        'Tools': 'Ferramentas',
        'Core Skills': 'Competências Essenciais'
    }
};

const DEFAULT_CATEGORIES = ['Hard Skills', 'Soft Skills', 'Languages'];
const ALL_CATEGORIES = ['Hard Skills', 'Soft Skills', 'Languages', 'Tools', 'Core Skills'];

export const SkillsEditor = ({ value, onChange, suggestedSkills = [] }) => {
    const [mode, setMode] = useState('categorized'); // 'categorized' | 'single'
    const [language, setLanguage] = useState('English');
    const [categories, setCategories] = useState({});
    const [newItem, setNewItem] = useState({});

    // Parse the initial string value
    useEffect(() => {
        if (!value) {
            // Default initialization
            initCategories(DEFAULT_CATEGORIES, 'English', 'categorized');
            return;
        }

        // Detect structure
        const parts = value.split('|');
        const parsedCategories = {};
        let detectedLanguage = 'English';
        let isStructured = false;

        // Try to parse categories
        parts.forEach(part => {
            if (part.includes(':')) {
                const [label, content] = part.split(':').map(s => s.trim());
                if (label && content) {
                    parsedCategories[label] = content.split(',').map(s => s.trim()).filter(s => s);
                    isStructured = true;
                    
                    // Try to detect language from label
                    Object.entries(CATEGORY_TRANSLATIONS).forEach(([lang, trans]) => {
                        if (Object.values(trans).includes(label)) {
                            detectedLanguage = lang;
                        }
                    });
                }
            }
        });

        if (isStructured) {
            setLanguage(detectedLanguage);
            setCategories(parsedCategories);
            setMode(Object.keys(parsedCategories).length === 1 && Object.keys(parsedCategories)[0].includes('Core') ? 'single' : 'categorized');
        } else {
            // Legacy flat format
            setMode('single');
            const coreLabel = CATEGORY_TRANSLATIONS['English']['Core Skills'];
            setCategories({
                [coreLabel]: value.split(',').map(s => s.trim()).filter(s => s)
            });
        }
    }, []);

    const initCategories = (cats, lang, m) => {
        const newCats = {};
        if (m === 'single') {
            newCats[CATEGORY_TRANSLATIONS[lang]['Core Skills']] = [];
        } else {
            cats.forEach(c => {
                newCats[CATEGORY_TRANSLATIONS[lang][c]] = [];
            });
        }
        setCategories(newCats);
    };

    const updateParent = (newCategories) => {
        const parts = [];
        Object.entries(newCategories).forEach(([label, skills]) => {
            if (skills.length > 0) {
                parts.push(`${label}: ${skills.join(', ')}`);
            }
        });
        
        // If single mode and just comma separated, maybe we should return just the string?
        // But ResumeTemplates expects structure for rendering titles.
        // Let's keep structure: "Core Skills: a, b, c"
        onChange(parts.join(' | '));
    };

    const handleLanguageChange = (newLang) => {
        const oldTrans = CATEGORY_TRANSLATIONS[language];
        const newTrans = CATEGORY_TRANSLATIONS[newLang];
        const newCategories = {};

        Object.entries(categories).forEach(([oldLabel, items]) => {
            // Find key for old label
            let key = Object.keys(oldTrans).find(k => oldTrans[k] === oldLabel);
            if (!key) key = oldLabel; // Fallback if custom label
            
            // Get new label
            const newLabel = newTrans[key] || key;
            newCategories[newLabel] = items;
        });

        setLanguage(newLang);
        setCategories(newCategories);
        updateParent(newCategories);
    };

    const handleModeChange = (newMode) => {
        if (newMode === mode) return;

        let newCategories = {};
        const trans = CATEGORY_TRANSLATIONS[language];

        if (newMode === 'single') {
            // Merge all into Core Skills
            const allSkills = Object.values(categories).flat();
            newCategories[trans['Core Skills']] = allSkills;
        } else {
            // Split into defaults (Hard/Soft/Languages)
            // We can't know which is which, so put all in Hard Skills initially
            const allSkills = Object.values(categories).flat();
            newCategories[trans['Hard Skills']] = allSkills;
            newCategories[trans['Soft Skills']] = [];
            newCategories[trans['Languages']] = [];
        }

        setMode(newMode);
        setCategories(newCategories);
        updateParent(newCategories);
    };

    const toggleCategory = (catKey) => {
        const label = CATEGORY_TRANSLATIONS[language][catKey];
        const newCategories = { ...categories };
        
        if (newCategories[label]) {
            // Remove category (move items to first available or delete?)
            // Let's just delete for now, maybe warn? Or move to 'Other'
            delete newCategories[label];
        } else {
            // Add category
            newCategories[label] = [];
        }
        setCategories(newCategories);
        updateParent(newCategories);
    };

    const addItem = (category) => {
        const item = newItem[category]?.trim();
        if (!item) return;

        const newCategories = {
            ...categories,
            [category]: [...(categories[category] || []), item]
        };
        setCategories(newCategories);
        setNewItem(prev => ({ ...prev, [category]: '' }));
        updateParent(newCategories);
    };

    const removeItem = (category, index) => {
        const newCategories = {
            ...categories,
            [category]: categories[category].filter((_, i) => i !== index)
        };
        setCategories(newCategories);
        updateParent(newCategories);
    };

    const handleKeyDown = (e, category) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem(category);
        }
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
                
                {/* Mode Selector */}
                <div className="flex bg-neutral-800 rounded-lg p-1">
                    <button
                        onClick={() => handleModeChange('categorized')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            mode === 'categorized' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        Categorized
                    </button>
                    <button
                        onClick={() => handleModeChange('single')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            mode === 'single' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        Single List
                    </button>
                </div>

                <div className="h-6 w-px bg-neutral-800"></div>

                {/* Language Selector */}
                <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-neutral-800 text-xs font-bold text-white px-3 py-1.5 rounded-lg border border-neutral-700 outline-none focus:border-neutral-500"
                >
                    {Object.keys(CATEGORY_TRANSLATIONS).map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>

                {/* Category Toggles (only in categorized mode) */}
                {mode === 'categorized' && (
                    <>
                        <div className="h-6 w-px bg-neutral-800"></div>
                        <div className="flex flex-wrap gap-2">
                            {ALL_CATEGORIES.map(catKey => {
                                const label = CATEGORY_TRANSLATIONS[language][catKey];
                                const isActive = !!categories[label];
                                return (
                                    <button
                                        key={catKey}
                                        onClick={() => toggleCategory(catKey)}
                                        className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border transition-all ${
                                            isActive 
                                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/50' 
                                                : 'bg-neutral-800 text-neutral-500 border-transparent hover:border-neutral-600'
                                        }`}
                                    >
                                        {isActive ? '✓ ' : '+ '}{label}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Editors */}
            <div className="space-y-6">
                {Object.keys(categories).map(category => (
                    <div key={category} className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex justify-between items-center">
                            {category}
                            {mode === 'categorized' && (
                                <button 
                                    onClick={() => {
                                        const newCats = { ...categories };
                                        delete newCats[category];
                                        setCategories(newCats);
                                        updateParent(newCats);
                                    }}
                                    className="text-neutral-600 hover:text-red-500 px-2"
                                >
                                    Remove
                                </button>
                            )}
                        </label>
                        
                        <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                            {categories[category].map((skill, index) => (
                                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neutral-800 text-white border border-neutral-700">
                                    {skill}
                                    <button
                                        onClick={() => removeItem(category, index)}
                                        className="ml-2 text-neutral-500 hover:text-red-500 focus:outline-none"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newItem[category] || ''}
                                onChange={(e) => setNewItem(prev => ({ ...prev, [category]: e.target.value }))}
                                onKeyDown={(e) => handleKeyDown(e, category)}
                                placeholder={`Add to ${category}...`}
                                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                            />
                            <button
                                onClick={() => addItem(category)}
                                className="px-4 py-2 bg-neutral-800 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Suggestions */}
            {suggestedSkills.length > 0 && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="text-blue-400 text-sm font-bold mb-2 flex items-center gap-2">
                        💡 AI Suggestions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {suggestedSkills.filter(s => {
                            // Filter out if present in any category
                            return !Object.values(categories).some(list => list.includes(s));
                        }).map(s => (
                            <button
                                key={s}
                                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded hover:bg-blue-500/30 transition-colors"
                                onClick={() => {
                                    // Add to first available category or Hard Skills/Core Skills
                                    const firstCat = Object.keys(categories)[0];
                                    if (firstCat) {
                                        const newCategories = {
                                            ...categories,
                                            [firstCat]: [...(categories[firstCat] || []), s]
                                        };
                                        setCategories(newCategories);
                                        updateParent(newCategories);
                                    }
                                }}
                            >
                                + {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
