import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import useRegister from '../hooks/useRegister'

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

const Register = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
    })
    const [profilepic, setProfilepic] = useState(null)
    const [picPreview, setPicPreview] = useState(null)
    const [picError, setPicError] = useState('')
    const fileInputRef = useRef(null)

    const { register, loading } = useRegister()

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!ALLOWED_TYPES.includes(file.type)) {
            setPicError('Invalid image type. Use JPG, PNG, WEBP or GIF.')
            return
        }
        if (file.size > MAX_SIZE) {
            setPicError('Image too large. Max 5MB.')
            return
        }

        setPicError('')
        const reader = new FileReader()
        reader.onloadend = () => {
            setProfilepic(reader.result)
            setPicPreview(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        await register({ ...formData, profilepic })
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-base-200'>
            <div className='card w-96 bg-base-100 shadow-xl'>
                <div className='card-body'>
                    <h2 className='card-title text-2xl font-bold justify-center mb-4'>
                        Create Account 💬
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* Profile Picture */}
                        <div className='form-control mb-4'>
                            <label className='label'>
                                <span className='label-text'>Profile Picture <span className='text-base-content/40'>(optional)</span></span>
                            </label>
                            <div className='flex items-center gap-4'>
                                <div
                                    className='w-16 h-16 rounded-full overflow-hidden bg-base-300 flex items-center justify-center cursor-pointer ring-2 ring-primary/30 flex-shrink-0'
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {picPreview ? (
                                        <img src={picPreview} alt='preview' className='w-full h-full object-cover' />
                                    ) : (
                                        <svg xmlns='http://www.w3.org/2000/svg' className='w-7 h-7 text-base-content/30' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' />
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15 13a3 3 0 11-6 0 3 3 0 016 0z' />
                                        </svg>
                                    )}
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <button
                                        type='button'
                                        className='btn btn-sm btn-outline'
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {picPreview ? 'Change' : 'Upload Photo'}
                                    </button>
                                    {picPreview && (
                                        <button
                                            type='button'
                                            className='btn btn-sm btn-ghost text-error'
                                            onClick={() => { setProfilepic(null); setPicPreview(null); }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type='file'
                                    accept='image/jpeg,image/jpg,image/png,image/webp,image/gif'
                                    className='hidden'
                                    onChange={handleImageChange}
                                />
                            </div>
                            {picError && <p className='text-error text-xs mt-1'>{picError}</p>}
                        </div>

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
