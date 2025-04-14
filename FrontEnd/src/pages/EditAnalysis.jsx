import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Plot from 'react-plotly.js';

const EditAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/survey-analyzer/analyses/${id}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        console.log('Fetched analysis:', response.data);
        setAnalysis(response.data);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('Failed to fetch analysis. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAnalysis({ ...analysis, [name]: value });
  };

  const handlePlotTextChange = (index, field, value) => {
    const updatedPlots = [...analysis.plots];
    updatedPlots[index][field] = value;
    setAnalysis({ ...analysis, plots: updatedPlots });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    
    try {
      // Create a copy of the analysis with plots that can be properly serialized
      const analysisToSubmit = {
        ...analysis,
        plots: analysis.plots.map(plot => ({
          title: plot.title,
          description: plot.description,
          data: plot.data
        }))
      };

      await axios.put(`${import.meta.env.VITE_BASE_URL}/survey-analyzer/analyses/${id}/`, analysisToSubmit, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      navigate('/dashboard/saved-analyses');
    } catch (err) {
      console.error('Error updating analysis:', err);
      setError('Failed to update analysis. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
          Analysis not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Analysis</h1>
        <button
          onClick={() => navigate('/dashboard/saved-analyses')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                name="title"
                value={analysis.title || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Author Name</label>
              <input
                type="text"
                name="author_name"
                value={analysis.author_name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={analysis.description || ''}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Plots</h2>
          <div className="space-y-6">
            {analysis.plots && analysis.plots.map((plot, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plot Title</label>
                    <input
                      type="text"
                      value={plot.title || ''}
                      onChange={(e) => handlePlotTextChange(index, 'title', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Plot Description</label>
                  <textarea
                    value={plot.description || ''}
                    onChange={(e) => handlePlotTextChange(index, 'description', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                  />
                </div>
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Plot Preview</h3>
                  {plot.data ? (
                    <Plot
                      data={plot.data.data || []}
                      layout={{
                        ...plot.data.layout || {},
                        autosize: true,
                        height: 400,
                        margin: { l: 50, r: 50, t: 50, b: 50 },
                        title: plot.title || ''
                      }}
                      style={{ width: '100%' }}
                      config={{ responsive: true }}
                    />
                  ) : (
                    <div className="text-sm text-gray-500 p-4 text-center">
                      No plot data available
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveLoading}
            className={`px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              saveLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAnalysis;