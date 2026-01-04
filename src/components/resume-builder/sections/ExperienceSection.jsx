import React from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { InputField } from '../ui/InputField';
import { MonthYearInput } from '../ui/MonthYearInput';
import { RichTextEditor } from '../ui/RichTextEditor';
import { SortableItem } from '../ui/SortableItem';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export const ExperienceSection = ({
    workExperience,
    setWorkExperience,
    expandedSections,
    toggleSection,
    improvingSection,
    aiImprovements,
    handleAIImprove
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = workExperience.findIndex((item) => item.id === active.id);
            const newIndex = workExperience.findIndex((item) => item.id === over.id);
            setWorkExperience(arrayMove(workExperience, oldIndex, newIndex));
        }
    };

    return (
        <div className="bg-[#1a1a1a] border-l-4 border-green-500 rounded-r-xl overflow-hidden mb-6">
            <SectionHeader
                icon="💼"
                title="Work Experience"
                subtitle={`${workExperience.length} positions added`}
                isComplete={workExperience.length > 0}
                isOpen={expandedSections['work']}
                onToggle={() => toggleSection('work')}
            />
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections['work'] ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="bg-[#151515] border-t border-neutral-800 p-6 space-y-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={workExperience.map(exp => exp.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {workExperience.length === 0 ? (
                                <div className="text-center py-8 bg-neutral-900 rounded-lg border border-neutral-800 border-dashed">
                                    <p className="text-neutral-500 mb-4">No work experience added yet.</p>
                                    <button
                                        className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
                                        onClick={() => {
                                            const newExp = {
                                                id: crypto.randomUUID(),
                                                position: '',
                                                company: '',
                                                start_date: '',
                                                end_date: '',
                                                description: '',
                                                location: ''
                                            };
                                            setWorkExperience([...workExperience, newExp]);
                                        }}
                                    >
                                        + Add Position
                                    </button>
                                </div>
                            ) : (
                                workExperience.map((exp, i) => (
                                    <SortableItem key={exp.id} id={exp.id}>
                                        <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-white text-sm">Position {i + 1}</h4>
                                                <button
                                                    className="text-red-500 hover:text-red-400 text-xs"
                                                    onClick={() => {
                                                        const newExp = workExperience.filter((_, idx) => idx !== i);
                                                        setWorkExperience(newExp);
                                                    }}
                                                >Remove</button>
                                            </div>

                                            <InputField
                                                label="Job Title"
                                                value={exp.position}
                                                onChange={(e) => {
                                                    const newExp = [...workExperience];
                                                    newExp[i] = { ...newExp[i], position: e.target.value };
                                                    setWorkExperience(newExp);
                                                }}
                                                placeholder="e.g. Senior Software Engineer"
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField
                                                    label="Company"
                                                    value={exp.company}
                                                    onChange={(e) => {
                                                        const newExp = [...workExperience];
                                                        newExp[i] = { ...newExp[i], company: e.target.value };
                                                        setWorkExperience(newExp);
                                                    }}
                                                    placeholder="e.g. Tech Corp"
                                                />
                                                <InputField
                                                    label="Location"
                                                    value={exp.location}
                                                    onChange={(e) => {
                                                        const newExp = [...workExperience];
                                                        newExp[i] = { ...newExp[i], location: e.target.value };
                                                        setWorkExperience(newExp);
                                                    }}
                                                    placeholder="e.g. San Francisco, CA"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <MonthYearInput
                                                        label="Start"
                                                        value={exp.start_date}
                                                        onChange={(val) => {
                                                            const newExp = [...workExperience];
                                                            newExp[i] = { ...newExp[i], start_date: val };
                                                            setWorkExperience(newExp);
                                                        }}
                                                    />
                                                    <div className="relative">
                                                        <MonthYearInput
                                                            label="End"
                                                            value={exp.end_date}
                                                            disabled={exp.current}
                                                            onChange={(val) => {
                                                                const newExp = [...workExperience];
                                                                newExp[i] = { ...newExp[i], end_date: val };
                                                                setWorkExperience(newExp);
                                                            }}
                                                        />
                                                        <div className="absolute -bottom-6 left-0 flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`work-current-${i}`}
                                                                checked={exp.current || false}
                                                                onChange={(e) => {
                                                                    const newExp = [...workExperience];
                                                                    newExp[i] = {
                                                                        ...newExp[i],
                                                                        current: e.target.checked,
                                                                        end_date: e.target.checked ? '' : newExp[i].end_date
                                                                    };
                                                                    setWorkExperience(newExp);
                                                                }}
                                                                className="rounded bg-neutral-800 border-neutral-700 text-orange-500 focus:ring-orange-500/20"
                                                            />
                                                            <label htmlFor={`work-current-${i}`} className="text-xs text-neutral-500 cursor-pointer select-none">Current</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <RichTextEditor
                                                label="Description"
                                                value={exp.description}
                                                onChange={e => {
                                                    const newExp = [...workExperience];
                                                    newExp[i] = { ...newExp[i], description: e.target.value };
                                                    setWorkExperience(newExp);
                                                }}
                                                placeholder="Describe your responsibilities and achievements..."
                                                maxLength={500}
                                                aiAssist={true}
                                                onImprove={() => handleAIImprove(`work-${i}`, exp.description, 'Improve this work experience description. Use strong action verbs, quantify impact (e.g. "Increased revenue by 20%"), and highlight technologies used.', 500)}
                                                isImproving={improvingSection === `work-${i}`}
                                                improvementResult={aiImprovements[`work-${i}`]}
                                            />
                                        </div>
                                    </SortableItem>
                                ))
                            )}
                        </SortableContext>
                    </DndContext>
                    {workExperience.length > 0 && (
                        <button
                            className="w-full py-3 bg-neutral-800 text-neutral-400 rounded-lg border border-neutral-700 border-dashed hover:text-white hover:border-neutral-500 transition-all mt-4"
                            onClick={() => {
                                const newExp = {
                                    id: crypto.randomUUID(),
                                    position: '',
                                    company: '',
                                    start_date: '',
                                    end_date: '',
                                    current: false,
                                    description: '',
                                    location: ''
                                };
                                setWorkExperience([...workExperience, newExp]);
                            }}
                        >
                            + Add Another Position
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
