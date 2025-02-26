import React, { useEffect } from 'react';

function Dashboard({ gasData, canvasRef, drawGraph }) {
  useEffect(() => {
    drawGraph();
  }, [gasData, drawGraph]);

  return (
    <div className="p-4 md:p-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400">Monitor your gas detection system in real-time</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="bg-[#1a2234] text-gray-300 pl-10 pr-4 py-2 rounded-lg w-64"
          />
          <span className="material-icons absolute left-3 top-2.5 text-gray-400">search</span>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {gasData.checkValue > 4 && (
        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
          gasData.checkValue > 6 ? 'bg-red-900/20' : 'bg-yellow-900/20'
        }`}>
          <div className="flex items-center">
            <span className="material-icons mr-3 text-red-500">warning</span>
            <div>
              <p className={`font-semibold ${
                gasData.checkValue > 6 ? 'text-red-500' : 'text-yellow-500'
              }`}>
                {gasData.checkValue > 6 ? 'Danger Level Alert' : 'Critical Level Alert'}
              </p>
              <p className="text-gray-400 text-sm">
                Current gas level: {gasData.checkValue} PPM
              </p>
            </div>
          </div>
          <div className="animate-pulse">
            <span className="material-icons text-red-500">error</span>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* System Status */}
        <div className="col-span-2">
          <div className="bg-[#1a2234] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">System Status</h3>
              <div className="flex gap-4">
                <span className="text-yellow-500">Critical: 4 PPM</span>
                <span className="text-red-500">Danger: 6 PPM</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Gas Status */}
              <div className="bg-[#0f1520] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Gas Status</p>
                    <p className={`text-lg font-semibold ${
                      gasData.checkValue > 6 ? 'text-red-500' :
                      gasData.checkValue > 4 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {gasData.checkValue > 6 ? 'Danger' :
                       gasData.checkValue > 4 ? 'Critical' :
                       'Normal'}
                    </p>
                  </div>
                  {gasData.checkValue > 4 && (
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      gasData.checkValue > 6 
                        ? 'bg-red-900/20 text-red-500' 
                        : 'bg-yellow-900/20 text-yellow-500'
                    }`}>
                      {gasData.checkValue > 6 ? 'Danger' : 'Critical'}
                    </span>
                  )}
                </div>
              </div>

              {/* Gas Supply Status */}
              <div className="bg-[#0f1520] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Gas Supply</p>
                    <p className={`text-lg font-semibold ${
                      gasData.isLeak === 1 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {gasData.isLeak === 1 ? 'Closed' : 'Open'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded text-sm bg-gray-700/50 text-gray-400">
                    {gasData.isLeak === 1 ? 'Auto-Closed' : 'Supply Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gas Level Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Gas Level Monitor */}
        <div className="col-span-2">
          <div className="bg-[#1a2234] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Gas Level Monitor</h3>
              <div className="flex gap-4">
                <span className="text-yellow-500">Critical: 4 PPM</span>
                <span className="text-red-500">Danger: 6 PPM</span>
              </div>
            </div>

            <div className="bg-[#0f1520] h-64 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* ... activity components ... */}
      </div>
    </div>
  );
}

export default Dashboard; 