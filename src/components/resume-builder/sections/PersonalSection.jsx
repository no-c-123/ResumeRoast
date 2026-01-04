import React from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { InputField } from '../ui/InputField';

export const PersonalSection = ({ profile, handleProfileChange, expandedSections, toggleSection }) => {
    return (
        <div className="bg-[#1a1a1a] border-l-4 border-orange-500 rounded-r-xl overflow-hidden mb-6">
            <SectionHeader
                icon="👤"
                title="Personal Information"
                subtitle="Start with the basics"
                isComplete={profile.full_name && profile.email && profile.phone}
                isOpen={expandedSections['personal']}
                onToggle={() => toggleSection('personal')}
            />

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections['personal'] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="bg-[#151515] border-t border-neutral-800 p-6 space-y-6">
                    <InputField
                        label="Full Name"
                        value={profile.full_name}
                        onChange={e => handleProfileChange('full_name', e.target.value)}
                        placeholder="e.g. Hector Leal"
                        helper="Your name as it should appear on your resume"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label="Location"
                            value={profile.location}
                            onChange={e => handleProfileChange('location', e.target.value)}
                            placeholder="City, Country"
                            icon="📍"
                        />
                        <InputField
                            label="Phone"
                            value={profile.phone}
                            onChange={e => handleProfileChange('phone', e.target.value)}
                            placeholder="(555) 123-4567"
                            icon="📱"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label="Email"
                            value={profile.email}
                            onChange={e => handleProfileChange('email', e.target.value)}
                            placeholder="you@example.com"
                            type="email"
                        />
                        <InputField
                            label="LinkedIn"
                            value={profile.linkedin}
                            onChange={e => handleProfileChange('linkedin', e.target.value)}
                            placeholder="linkedin.com/in/username"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
