import { useState } from 'react'
import { Link } from 'react-router-dom'
import useRegister from '../hooks/useRegister'

const Register = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
    })

    const { register, loading } = useRegister()

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        await register(formData)
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-base-200'>
            <div className='card w-96 bg-base-100 shadow-xl'>
                <div className='card-body'>
                    <h2 className='card-title text-2xl font-bold justify-center mb-4'>
                        Create Account 💬
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* Full Name */}
                        <div className='form-control mb-3'>
                            <label className='label'>
                                <span className='label-text'>Full Name</span>
                            </label>
                            <input
                                type='text'
                                name='fullname'
                                placeholder='John Doe'
                                className='input input-bordered'
                                value={formData.fullname}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Username */}
                        <div className='form-control mb-3'>
                            <label className='label'>
                                <span className='label-text'>Username</span>
                            </label>
                            <input
                                type='text'
                                name='username'
                                placeholder='johndoe'
                                className='input input-bordered'
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className='form-control mb-3'>
                            <label className='label'>
                                <span className='label-text'>Email</span>
                            </label>
                            <input
                                type='email'
                                name='email'
                                placeholder='john@email.com'
                                className='input input-bordered'
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className='form-control mb-3'>
                            <label className='label'>
                                <span className='label-text'>Password</span>
                            </label>
                            <input
                                type='password'
                                name='password'
                                placeholder='••••••••'
                                className='input input-bordered'
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className='form-control mb-3'>
                            <label className='label'>
                                <span className='label-text'>Confirm Password</span>
                            </label>
                            <input
                                type='password'
                                name='confirmPassword'
                                placeholder='••••••••'
                                className='input input-bordered'
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Gender */}
                        <div className='form-control mb-5'>
                            <label className='label'>
                                <span className='label-text'>Gender</span>
                            </label>
                            <div className='flex gap-6 px-1'>
                                <label className='flex items-center gap-2 cursor-pointer'>
                                    <input
                                        type='radio'
                                        name='gender'
                                        value='male'
                                        className='radio radio-primary radio-sm'
                                        checked={formData.gender === 'male'}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span className='label-text'>Male</span>
                                </label>
                                <label className='flex items-center gap-2 cursor-pointer'>
                                    <input
                                        type='radio'
                                        name='gender'
                                        value='female'
                                        className='radio radio-primary radio-sm'
                                        checked={formData.gender === 'female'}
                                        onChange={handleChange}
                                    />
                                    <span className='label-text'>Female</span>
                                </label>
                            </div>
                        </div>

                        <button
                            type='submit'
                            className='btn btn-primary w-full'
                            disabled={loading}
                        >
                            {loading
                                ? <span className='loading loading-spinner'></span>
                                : 'Create Account'
                            }
                        </button>
                    </form>

                    <p className='text-center mt-3'>
                        Already have an account?{' '}
                        <Link to='/login' className='text-primary font-semibold'>
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register
