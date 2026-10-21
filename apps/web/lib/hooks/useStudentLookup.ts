"use client";

import { useState } from "react";
import { findStudentByIdentifier } from "@/lib/actions";

export interface FoundStudent {
  id: string;
  name: string | null;
  email: string | null;
  studentId: string | null;
  purchasedCourseIds: string[];
  certificates: { id: string; trackName: string; certificateCode: string; issueDate: Date }[];
}

// Shared by GrantAccessModal (Students tab) and StudentAccessPanel (Internships tab) —
// both independently look a student up by email/Student ID before granting or revoking
// anything. The two panels stay deliberately separate surfaces (different client asks,
// different layouts); only this lookup slice — form state, the fetch itself, and
// re-fetching after an action changes the student's record — was actually duplicated.
export function useStudentLookup() {
  const [identifier, setIdentifier] = useState("");
  const [looking, setLooking] = useState(false);
  const [student, setStudent] = useState<FoundStudent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLooking(true);
    setError("");
    setNotFound(false);
    setStudent(null);
    try {
      const result = await findStudentByIdentifier(identifier);
      if (!result) setNotFound(true);
      else setStudent(result);
    } catch (err: any) {
      setError(err?.message ?? "Lookup failed.");
    } finally {
      setLooking(false);
    }
  }

  // Re-fetches the current student by their own email — used after an action that can
  // change more than the field it directly touches (e.g. issuing a certificate can also
  // grant its mapped courses), so callers don't have to reconstruct that logic themselves.
  async function refresh() {
    if (!student?.email) return;
    const refreshed = await findStudentByIdentifier(student.email);
    if (refreshed) setStudent(refreshed);
  }

  function reset() {
    setIdentifier("");
    setStudent(null);
    setNotFound(false);
    setError("");
  }

  return {
    identifier,
    setIdentifier,
    looking,
    student,
    setStudent,
    notFound,
    error,
    setError,
    handleLookup,
    refresh,
    reset,
  };
}
