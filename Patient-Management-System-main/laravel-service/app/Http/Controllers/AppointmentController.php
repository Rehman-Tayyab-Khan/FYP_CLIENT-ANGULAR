<?php

namespace App\Http\Controllers;

use App\Http\Request\Appointment\StoreAppointmentRequest;
use App\Http\Request\Appointment\CompleteAppointmentRequest;
use App\Http\Request\Appointment\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\VisitResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Response;
use App\Enums\Role;
use App\Enums\AppointmentStatus;
use App\Enums\FdoPermission;
use App\Enums\HttpStatus;

class AppointmentController extends Controller
{
    public function __construct(
        private AppointmentService $appointmentService
    ) {}

    // List
    public function index(Request $request): AnonymousResourceCollection
    {
        $appointments = $this->appointmentService->getAll($request, Auth::user());

        return AppointmentResource::collection($appointments)->additional([
            'success' => true,
            'message' => '',
        ]);
    }

    // Show
    public function show(Appointment $appointment): JsonResponse
    {
        // Doctor can only view their own appointments
        if (Auth::user()->role->value === Role::DOCTOR->value) {
            $doctorId = Auth::user()->doctorProfile?->id;
            if ($appointment->doctor_id !== $doctorId) {
                return Response::failure('Unauthorized.', 403);
            }
        }

        $appointment = $this->appointmentService->getById($appointment);

        return Response::success(new AppointmentResource($appointment));
    }

    // Create
    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if ($user->role->value === Role::FDO->value) {
            if (!$user->hasFdoPermission(FdoPermission::CREATE_APPOINTMENT)) {
                return Response::failure('You dont have permission to create appointment.', HttpStatus::FORBIDDEN->value);
            }
        }

        try {
            $validated = $request->validated();

            $appointment = $this->appointmentService->create(
                $validated,
                Auth::id()
            );


            return Response::success(
                ['appointment' => new AppointmentResource($appointment)],
                'Appointment scheduled successfully.',
                201
            );
        } catch (\Exception $e) {
            return Response::failure($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // Update
    public function update(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        try {
            $validated = $request->validated();
            $role = Auth::user()->role->value;

            if ($role === Role::DOCTOR->value) {
                $doctorId = Auth::user()->doctorProfile?->id;
                if ($appointment->doctor_id !== $doctorId) {
                    return Response::failure('Unauthorized.', 403);
                }
            }

            $appointment = $this->appointmentService->update(
                $appointment,
                $validated,
                $role
            );

            return Response::success(
                ['appointment' => new AppointmentResource($appointment)],
                'Appointment updated successfully.'
            );
        } catch (\Exception $e) {
            return Response::failure($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    public function complete(CompleteAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $user = Auth::user();
        $wasAlreadyCompleted = $appointment->status === AppointmentStatus::COMPLETED;

        if ($user->role->value !== Role::DOCTOR->value) {
            return Response::failure('Only doctors can complete appointments from this endpoint.', 403);
        }

        try {
            $result = $this->appointmentService->completeByDoctor(
                $appointment,
                $request->validated(),
                (string) $user->doctorProfile?->id
            );

            $message = $wasAlreadyCompleted
                ? 'Visit details updated successfully.'
                : 'Appointment marked as completed and visit details saved.';

            return Response::success(
                [
                    'appointment' => new AppointmentResource($result['appointment']),
                    'visit' => new VisitResource($result['visit']),
                ],
                $message
            );
        } catch (\Exception $e) {
            return Response::failure($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // Cancel
    public function cancel(Appointment $appointment): JsonResponse
    {
        if (Auth::user()->role->value === Role::DOCTOR->value) {
            return Response::failure('Doctors cannot cancel appointments.', 403);
        }

        try {
            $this->appointmentService->cancel($appointment);

            return Response::success([], 'Appointment cancelled successfully.');
        } catch (\Exception $e) {
            return Response::failure($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // Delete
    public function destroy(Appointment $appointment): JsonResponse
    {
        if (Auth::user()->role->value !== Role::ADMIN->value) {
            return Response::failure('Only admins can delete appointments.', 403);
        }

        $this->appointmentService->delete($appointment);

        return Response::success([], 'Appointment deleted successfully.');
    }
}
