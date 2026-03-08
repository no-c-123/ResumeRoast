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

export const SkillsEditor = ({ value, onChange, suggestedSkills = {} }) => {
    const [mode, setMode] = useState('categorized'); // 'categorized' | 'single'
    const [language, setLanguage] = useState('English');
    const [categories, setCategories] = useState({});
    const [newItem, setNewItem] = useState({});
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [tempCategoryName, setTempCategoryName] = useState('');

    // Helper to get suggestions for a category
    const getSuggestionsFor = (cat) => {
        if (!suggestedSkills || Array.isArray(suggestedSkills)) return [];
        
        // 1. Direct match
        if (suggestedSkills[cat]) return suggestedSkills[cat];
        
        // 2. Translation match
        const currentLangTrans = CATEGORY_TRANSLATIONS[language];
        const engKey = Object.keys(currentLangTrans).find(key => currentLangTrans[key] === cat);
        if (engKey && suggestedSkills[engKey]) return suggestedSkills[engKey];
        
        return [];
    };

    const getUnusedSuggestions = () => {
        if (!suggestedSkills || Array.isArray(suggestedSkills)) return [];
        
        const usedCategories = Object.keys(categories);
        const usedSkills = new Set();
        
        // Mark all suggestions that belong to currently displayed categories as "used"
        usedCategories.forEach(cat => {
            const suggestions = getSuggestionsFor(cat);
            suggestions.forEach(s => usedSkills.add(s));
        });
        
        // Collect all other suggestions
        const unused = [];
        Object.entries(suggestedSkills).forEach(([cat, skills]) => {
             if (Array.isArray(skills)) {
                 skills.forEach(s => {
                     // Only add if not already displayed inline AND not already in user's list
                     if (!usedSkills.has(s) && !Object.values(categories).some(list => list.includes(s))) {
                         unused.push({ skill: s, category: cat });
                     }
                 });
             }
        });
        
        return unused;
    };

    const addCustomCategory = () => {
        if (!newCategoryName.trim()) return;
        if (categories[newCategoryName]) return;
        
        const newCategories = {
            ...categories,
            [newCategoryName]: []
        };
        setCategories(newCategories);
        updateParent(newCategories);
        setNewCategoryName('');
    };

    const startEditingCategory = (cat) => {
        setEditingCategory(cat);
        setTempCategoryName(cat);
    };

    const saveCategoryName = (oldName) => {
        const trimmedName = tempCategoryName.trim();
        if (!trimmedName || trimmedName === oldName) {
            setEditingCategory(null);
            return;
        }
        
        if (categories[trimmedName]) {
            setEditingCategory(null);
            return;
        }
        
        const newCategories = {};
        Object.keys(categories).forEach(key => {
            if (key === oldName) {
                newCategories[trimmedName] = categories[oldName];
            } else {
                newCategories[key] = categories[key];
            }
        });
        
        setCategories(newCategories);
        updateParent(newCategories);
        setEditingCategory(null);
    };

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
                        <div className="flex flex-wrap gap-2 items-center">
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
                            
                            {/* Add Custom Category Input */}
                            <div className="flex items-center gap-1 ml-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="New Category..."
                                    className="bg-neutral-800 text-[10px] text-white px-2 py-1 rounded border border-neutral-700 w-24 focus:outline-none focus:border-neutral-500"
                                    onKeyDown={(e) => e.key === 'Enter' && addCustomCategory()}
                                />
                                <button
                                    onClick={addCustomCategory}
                                    disabled={!newCategoryName.trim()}
                                    className="px-2 py-1 bg-neutral-800 text-neutral-400 text-[10px] font-bold rounded border border-neutral-700 hover:text-white hover:border-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Editors */}
            <div className="space-y-6">
                {Object.keys(categories).map(category => {
                    const suggestions = getSuggestionsFor(category);
                    const availableSuggestions = suggestions.filter(s => !categories[category].includes(s));

                    return (
                        <div key={category} className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex justify-between items-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                {editingCategory === category ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text"
                                            value={tempCategoryName}
                                            onChange={(e) => setTempCategoryName(e.target.value)}
                                            className="bg-neutral-800 text-white px-2 py-1 rounded border border-neutral-600 focus:outline-none focus:border-blue-500"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveCategoryName(category);
                                                if (e.key === 'Escape') setEditingCategory(null);
                                            }}
                                            onBlur={() => saveCategoryName(category)}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group">
                                        <span>{category}</span>
                                        {mode === 'categorized' && (
                                            <button 
                                                onClick={() => startEditingCategory(category)}
                                                className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-white transition-opacity"
                                                title="Rename Category"
                                            >
                                                ✏️
                                            </button>
                                        )}
                                    </div>
                                )}

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
                            </div>
                            
                            {/* Inline Suggestions */}
                            {availableSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2 items-center">
                                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                        💡 Suggested:
                                    </span>
                                    {availableSuggestions.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                const newCategories = {
                                                    ...categories,
                                                    [category]: [...(categories[category] || []), s]
                                                };
                                                setCategories(newCategories);
                                                updateParent(newCategories);
                                            }}
                                            className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-[10px] rounded border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                        >
                                            + {s}
                                        </button>
                                    ))}
                                </div>
                            )}

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
                    );
                })}
            </div>

            {/* More Suggestions (Unused) */}
            {getUnusedSuggestions().length > 0 && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="text-blue-400 text-sm font-bold mb-2 flex items-center gap-2">
                        💡 More Suggestions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {getUnusedSuggestions().map(({ skill, category }) => (
                            <button
                                key={`${category}-${skill}`}
                                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                                onClick={() => {
                                    const trans = CATEGORY_TRANSLATIONS[language];
                                    // Try to find if this category name maps to a known key in current language
                                    // The 'category' from suggestions is likely English (e.g. "Hard Skills")
                                    // trans key is English (e.g. "Hard Skills"), value is Localized (e.g. "Habilidades Duras")
                                    
                                    let catLabel = category;
                                    
                                    // Check if 'category' matches a known key in English translations map
                                    // CATEGORY_TRANSLATIONS['English'] has keys same as values usually.
                                    // But we should check if 'category' is a key in CATEGORY_TRANSLATIONS[language]
                                    
                                    if (trans[category]) {
                                        catLabel = trans[category];
                                    }
                                    
                                    // Or if it's already localized? 
                                    // We assume suggestions are English keys mostly.
                                    
                                    const newCategories = { ...categories };
                                    if (!newCategories[catLabel]) {
                                        newCategories[catLabel] = [];
                                    }
                                    newCategories[catLabel] = [...newCategories[catLabel], skill];
                                    
                                    setCategories(newCategories);
                                    updateParent(newCategories);
                                }}
                                title={`Add to ${category}`}
                            >
                                <span className="opacity-50 text-[10px] uppercase mr-1">{category}:</span>
                                + {skill}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
