import { useState } from 'react'
import { Link } from 'react-router-dom'
import useLogin from '../hooks/useLogin'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { login, loading } = useLogin()

    const handleSubmit = async (e) => {
        e.preventDefault()
        await login(email, password) // ✅ matches useLogin(email, password)
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-base-200'>
            <div className='card w-96 bg-base-100 shadow-xl'>
                <div className='card-body'>
                    <h2 className='card-title text-2xl font-bold text-center justify-center mb-4'>
                        Login 💬
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className='form-control mb-3'>
                            <label className='label'>
                                <span className='label-text'>Email</span>
                            </label>
                            <input
                                type='email'
                                placeholder='Enter email'
                                className='input input-bordered'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className='form-control mb-5'>
                            <label className='label'>
                                <span className='label-text'>Password</span>
                            </label>
                            <input
                                type='password'
                                placeholder='Enter password'
                                className='input input-bordered'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type='submit'
                            className='btn btn-primary w-full'
                            disabled={loading}
                        >
                            {loading
                                ? <span className='loading loading-spinner'></span>
                                : 'Login'
                            }
                        </button>
                    </form>
                    <p className='text-center mt-3'>
                        Don't have an account?{' '}
                        <Link to='/register' className='text-primary font-semibold'>
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
