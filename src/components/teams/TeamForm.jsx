// src/components/teams/TeamForm.jsx

import { useState, useEffect } from 'react';
import { useTeamsStore } from '@stores/useTeamsStore';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Alert, AlertDescription } from '@components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function TeamForm({ editingTeam, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    participants: '',
    contact: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const addTeam = useTeamsStore((state) => state.addTeam);
  const updateTeam = useTeamsStore((state) => state.updateTeam);

  const isEditMode = !!editingTeam;

  // Populate form when editing
  useEffect(() => {
    if (editingTeam) {
      setFormData({
        name: editingTeam.name || '',
        participants: editingTeam.participants || '',
        contact: editingTeam.contact || '',
      });
    }
  }, [editingTeam]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear submit messages on change
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const validateForm = () => {
    const newErrors = {};

    // Team name is required
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }

    // Participants required
    if (!formData.participants.trim()) {
      newErrors.participants = 'Participant names are required';
    }

    // Contact number required and should be valid
    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.contact)) {
      newErrors.contact = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let result;

      if (isEditMode) {
        // Update existing team
        result = updateTeam(editingTeam.id, {
          name: formData.name.trim(),
          participants: formData.participants.trim(),
          contact: formData.contact.trim(),
        });
      } else {
        // Add new team
        result = addTeam({
          name: formData.name.trim(),
          participants: formData.participants.trim(),
          contact: formData.contact.trim(),
        });
      }

      if (result.success) {
        // Success
        setSubmitSuccess(true);

        // Reset form if adding (not editing)
        if (!isEditMode) {
          setFormData({
            name: '',
            participants: '',
            contact: '',
          });
        }

        // Notify parent
        if (onSuccess) {
          onSuccess(result);
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } else {
        // Error from store
        setSubmitError(result.error || 'Failed to save team');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      participants: '',
      contact: '',
    });
    setErrors({});
    setSubmitSuccess(false);
    setSubmitError(null);

    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Success Message */}
      {submitSuccess && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Team {isEditMode ? 'updated' : 'added'} successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Team Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Team Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g., Team Alpha"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Participants */}
      <div className="space-y-2">
        <Label htmlFor="participants">
          Participants <span className="text-destructive">*</span>
        </Label>
        <Input
          id="participants"
          name="participants"
          type="text"
          placeholder="e.g., John, Sarah, Mike"
          value={formData.participants}
          onChange={handleChange}
          className={errors.participants ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.participants && (
          <p className="text-sm text-destructive">{errors.participants}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter participant names separated by commas
        </p>
      </div>

      {/* Contact Number */}
      <div className="space-y-2">
        <Label htmlFor="contact">
          Phone-a-Friend Contact <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contact"
          name="contact"
          type="tel"
          placeholder="e.g., +94 77 123 4567"
          value={formData.contact}
          onChange={handleChange}
          className={errors.contact ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.contact && (
          <p className="text-sm text-destructive">{errors.contact}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Contact number to call when using Phone-a-Friend lifeline
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-2">
        {isEditMode && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1">
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={isEditMode ? 'flex-1' : 'w-full'}>
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Adding...'
            : isEditMode
              ? 'Update Team'
              : 'Add Team'}
        </Button>
      </div>
    </form>
  );
}
