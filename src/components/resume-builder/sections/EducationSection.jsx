import React from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { InputField } from '../ui/InputField';
import { MonthYearInput } from '../ui/MonthYearInput';

export const EducationSection = ({ education, setEducation, expandedSections, toggleSection }) => {
    return (
        <div className="bg-[#1a1a1a] border-l-4 border-yellow-500 rounded-r-xl overflow-hidden mb-6">
            <SectionHeader
                icon="🎓"
                title="Education"
                subtitle={`${education.length} schools added`}
                isComplete={education.length > 0}
                isOpen={expandedSections['education']}
                onToggle={() => toggleSection('education')}
            />
            <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedSections['education'] ? 'max-h-[2000px]' : 'max-h-0'
                    }`}
            >
                <div className="bg-[#151515] border-t border-neutral-800 p-6 space-y-6">
                    {education.map((edu, i) => (
                        <div key={i} className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 relative space-y-4">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-white text-sm">Education {i + 1}</h4>
                                <button
                                    className="text-red-500 hover:text-red-400 text-xs"
                                    onClick={() => {
                                        const newEdu = education.filter((_, idx) => idx !== i);
                                        setEducation(newEdu);
                                    }}
                                >Remove</button>
                            </div>

                            <InputField
                                label="School / University"
                                value={edu.school}
                                onChange={(e) => {
                                    const newEdu = [...education];
                                    newEdu[i] = { ...newEdu[i], school: e.target.value };
                                    setEducation(newEdu);
                                }}
                                placeholder="e.g. Stanford University"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="Degree"
                                    value={edu.degree}
                                    onChange={(e) => {
                                        const newEdu = [...education];
                                        newEdu[i] = { ...newEdu[i], degree: e.target.value };
                                        setEducation(newEdu);
                                    }}
                                    placeholder="e.g. BS Computer Science"
                                />
                                <InputField
                                    label="Location"
                                    value={edu.location}
                                    onChange={(e) => {
                                        const newEdu = [...education];
                                        newEdu[i] = { ...newEdu[i], location: e.target.value };
                                        setEducation(newEdu);
                                    }}
                                    placeholder="e.g. New York, NY"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <MonthYearInput
                                        label="Start"
                                        value={edu.start_date}
                                        onChange={(val) => {
                                            const newEdu = [...education];
                                            newEdu[i] = { ...newEdu[i], start_date: val };
                                            setEducation(newEdu);
                                        }}
                                    />
                                    <div className="relative">
                                        <MonthYearInput
                                            label="End"
                                            value={edu.end_date}
                                            disabled={edu.current}
                                            onChange={(val) => {
                                                const newEdu = [...education];
                                                newEdu[i] = { ...newEdu[i], end_date: val };
                                                setEducation(newEdu);
                                            }}
                                        />
                                        <div className="absolute -bottom-6 left-0 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`edu-current-${i}`}
                                                checked={edu.current || false}
                                                onChange={(e) => {
                                                    const newEdu = [...education];
                                                    newEdu[i] = {
                                                        ...newEdu[i],
                                                        current: e.target.checked,
                                                        end_date: e.target.checked ? '' : newEdu[i].end_date
                                                    };
                                                    setEducation(newEdu);
                                                }}
                                                className="rounded bg-neutral-800 border-neutral-700 text-orange-500 focus:ring-orange-500/20"
                                            />
                                            <label htmlFor={`edu-current-${i}`} className="text-xs text-neutral-500 cursor-pointer select-none">Current</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        className="w-full py-3 bg-neutral-800 text-neutral-400 rounded-lg border border-neutral-700 border-dashed hover:text-white hover:border-neutral-500 transition-all mt-4"
                        onClick={() => {
                            const newEdu = { school: '', degree: '', start_date: '', end_date: '', current: false, location: '' };
                            setEducation([...education, newEdu]);
                        }}
                    >
                        + Add Education
                    </button>
                </div>
            </div>
        </div>
    );
};
